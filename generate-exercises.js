#!/usr/bin/env node
/**
 * Exercise Generator — Compact JSON → Full Exercise YAML
 *
 * Usage:
 *   node generate-exercises.js <course-slug> <module-id> < input.json
 *   node generate-exercises.js infra-go 2 < module2.json
 *   echo '<json>' | node generate-exercises.js infra-go 2
 *
 * Reads compact JSON from stdin, writes full exercise YAML to:
 *   courses/<slug>/content/exercises/module<id>-variants.yaml
 *
 * Compact format:
 * {
 *   "conceptLinks": { "Concept Name": "#section-anchor" },
 *   "warmups": [
 *     {
 *       "concept": "Concept Name",
 *       "variants": [
 *         {
 *           "title": "Exercise Title",
 *           "desc": "Description with <code>html</code>",
 *           "hints": ["hint 1", "hint 2"],
 *           "solution": "code\nhere"
 *         }
 *       ]
 *     }
 *   ],
 *   "challenges": [
 *     {
 *       "concept": "Concept Name",
 *       "difficulty": 2,
 *       "docLinks": [{ "url": "...", "title": "...", "note": "..." }],
 *       "variants": [
 *         {
 *           "title": "Challenge Title",
 *           "desc": "Description",
 *           "difficulty": 2,
 *           "sig": "func foo(x int) int",
 *           "tests": [{ "in": "foo(1)", "out": "2" }],
 *           "think": "Think about it content",
 *           "hint": "Detailed hint content",
 *           "solution": "func foo(x int) int {\n    return x * 2\n}",
 *           "annotations": [{ "type": "pattern", "label": "Label", "text": "Annotation text" }]
 *         }
 *       ]
 *     }
 *   ]
 * }
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const slug = process.argv[2];
const moduleId = process.argv[3];

if (!slug || !moduleId) {
    console.error('Usage: node generate-exercises.js <course-slug> <module-id> < input.json');
    console.error('Example: node generate-exercises.js infra-go 2 < module2-compact.json');
    process.exit(1);
}

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
    try {
        const data = JSON.parse(input);
        const yamlOut = generate(data);
        const outPath = path.join('courses', slug, 'content', 'exercises', `module${moduleId}-variants.yaml`);
        fs.writeFileSync(outPath, yamlOut, 'utf8');
        console.log(`Wrote ${outPath} (${yamlOut.length} bytes)`);

        // Count exercises
        let warmupCount = 0, challengeCount = 0;
        if (data.warmups) {
            for (const w of data.warmups) warmupCount += w.variants.length;
        }
        if (data.challenges) {
            for (const c of data.challenges) challengeCount += c.variants.length;
        }
        console.log(`  ${warmupCount} warmup variants, ${challengeCount} challenge variants`);
    } catch (e) {
        console.error('Error:', e.message);
        process.exit(1);
    }
});

function generate(data) {
    const out = {
        conceptLinks: data.conceptLinks || {},
        sharedContent: {},
        variants: {
            warmups: [],
            challenges: []
        }
    };

    // Generate warmups
    if (data.warmups) {
        data.warmups.forEach((warmup, wIdx) => {
            const entry = {
                id: `warmup_${wIdx + 1}`,
                concept: warmup.concept,
                variants: warmup.variants.map((v, vIdx) => {
                    const variant = {
                        id: `v${vIdx + 1}`,
                        title: v.title,
                        description: v.desc
                    };
                    variant.hints = v.hints || [];
                    variant.solution = v.solution;
                    return variant;
                })
            };
            out.variants.warmups.push(entry);
        });
    }

    // Generate challenges
    if (data.challenges) {
        data.challenges.forEach((challenge, cIdx) => {
            const entry = {
                id: `challenge_${cIdx + 1}`,
                block: cIdx + 1,
                difficulty: challenge.difficulty || 1,
                concept: challenge.concept
            };
            if (challenge.docLinks) {
                entry.docLinks = challenge.docLinks;
            }
            entry.variants = challenge.variants.map((v, vIdx) => {
                const variant = {
                    id: `v${vIdx + 1}`,
                    title: v.title,
                    description: v.desc
                };
                if (v.sig) variant.functionSignature = v.sig;
                if (v.difficulty) variant.difficulty = v.difficulty;
                if (v.tests) {
                    variant.testCases = v.tests.map(t => ({
                        input: t.in,
                        output: t.out
                    }));
                }
                // Hints with emoji titles
                variant.hints = [];
                if (v.think) {
                    variant.hints.push({
                        title: '🤔 Think about it',
                        content: v.think
                    });
                }
                if (v.hint) {
                    variant.hints.push({
                        title: '💡 Hint',
                        content: v.hint
                    });
                }
                variant.solution = v.solution;
                if (v.annotations) {
                    variant.annotations = v.annotations.map(a => ({
                        type: a.type,
                        label: a.label,
                        text: a.text
                    }));
                }
                return variant;
            });
            out.variants.challenges.push(entry);
        });
    }

    // Custom YAML dump with nice formatting
    return yaml.dump(out, {
        lineWidth: 120,
        noRefs: true,
        quotingType: '"',
        forceQuotes: false,
        flowLevel: -1,
        styles: {
            '!!str': 'literal'
        }
    });
}
