# Hallmarks of AI writing, and the rules this site follows

Research backing the copy on this site. Six sources, listed at the bottom. The point
is not to dodge detectors. It is that the tells below are genuinely worse writing:
vague, inflated, and interchangeable. Removing them makes the copy say more.

## What the sources agree on

### 1. A specific overused vocabulary

Kobak et al. measured 14.2 million PubMed abstracts and found 280 "excess" style
words in 2024 that no prior trend predicted. The standouts by frequency ratio:
*delves* (25x expected), *showcasing* (9.2x), *underscores* (9.1x). Crucially, the
2024 excess words were 66% verbs and 18% adjectives, where the COVID-era spike had
been nouns. The shift was stylistic, not topical. Models reach for flowery verbs.

Juzek and Ward isolated 21 words that ChatGPT overproduces: delve, showcasing,
boasts, underscores, intricacies, surpassing, intricate, garnered, emphasizing,
realm, groundbreaking, advancements, aligns, and relatives. Their best explanation
is RLHF: annotators appear to have used these words as a proxy for quality, so the
model overlearned them. When they tested readers, people actively preferred
abstracts *without* "delve" in the opening line.

Wikipedia's field guide adds the promotional register: *vibrant, rich, profound,
exemplifies, commitment to, nestled, in the heart of, renowned, diverse array,
stands as a testament, pivotal moment, evolving landscape, indelible mark*.

**Rule: none of these words appear on this site.**

### 2. Significance inflation

The most reliable tell is not vocabulary, it is the reflex to explain why something
matters. AI writing appends importance to whatever it describes. Wikipedia's guide
catalogues the pattern: "stands as," "serves as," "is a testament to," "plays a
crucial role," "underscores its importance," "reflects a broader." TechCrunch's
write-up of the guide notes that AI inflates notability by listing minor media
mentions, the way a personal bio does rather than an independent source.

An example the guide cites: a population figure described as "creating a lively
community within its borders, further enhancing its significance as a dynamic hub."
The number said something. The commentary said nothing.

**Rule: state the fact, stop. No line explains why the preceding line matters.**

### 3. Superficial analysis via participles

Wikipedia flags trailing "-ing" clauses that simulate analysis: *emphasizing...,
highlighting..., reflecting..., fostering..., contributing to...*. They attach an
unearned conclusion to a fact without evidence for it.

The PNAS study by Reinhart et al. found the grammatical version of this. Using
Biber's feature set, present participial clauses and nominalizations are among the
features that most separate LLM from human writing, with instruction-tuned Llama 3
using nominalizations at 1.5 to 2 times the human rate.

**Rule: no trailing participial clauses that editorialize. Nouns built from verbs
(*utilization*, *implementation*) get rewritten back into verbs.**

### 4. Structural monotony

Muñoz-Ortiz et al. found human sentence lengths scatter far more widely, while LLMs
cluster in the 10 to 30 token band and rarely produce the extremes. Humans write
more long sentences and more very short ones.

Related patterns from Wikipedia's guide:
- The rule of three: "adjective, adjective, adjective" padding out a thin idea.
- Negative parallelism: "not just X, but Y", "it's not X, it's Y", "X rather than Y".
- Elegant variation: swapping in synonyms to dodge repetition, which reads worse
  than just repeating the word.
- Avoiding "is": substituting *serves as, stands as, functions as, represents,
  boasts, features* where a plain copula was correct.

**Rule: vary sentence length deliberately, including some very short ones. At most
one three-item list in the whole page. No negative parallelism. "Is" is allowed.**

### 5. Formatting tells

Wikipedia's guide lists em dashes, curly quotes, title case in headings, and heavy
boldface as markers. Em dashes are the most widely recognised one.

**Rule: no em dashes anywhere in this repo, copy or comments. Sentence case
headings. Bold used for nothing decorative.** (This also matches a standing
preference of Anirud's that predates the research.)

### 6. The positive test: concreteness

Orwell's 1946 rules still cover the failure mode better than anything written since.
Never use a figure of speech you are used to seeing in print. Never use a long word
where a short one will do. If a word can be cut, cut it. Prefer the active voice.
His diagnosis of bad prose was that it moves away from concreteness, and the
correction is to ground the reader in specifics.

This is the part that actually matters. Removing banned words from vague copy leaves
vague copy. The fix is a real number, a real constraint, a real date.

Weak: "Built a game that showcases my passion for systems design."
Better: "Two mountains, five survival systems, about 100 hours of work, solo."

**Rule: every claim carries a specific. If a sentence survives with the specifics
removed, it was not saying anything.**

## The checklist applied to every line

1. Does it contain a banned word? Cut it.
2. Does it explain why something matters? Cut the explanation, keep the fact.
3. Does it end in a participle that draws a conclusion? Cut the clause.
4. Are three consecutive sentences the same length? Break one.
5. Is there a number, name, date, or constraint in it? If not, add one or delete it.
6. Read it aloud. Would Anirud say it out loud to another person?

## Sources

1. [Wikipedia:Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing),
   WikiProject AI Cleanup. The most detailed field guide available, roughly 15,000
   words, maintained by editors who clean up AI text at volume.
2. Kobak, D., et al. [Delving into LLM usage in academic writing through excess
   vocabulary](https://arxiv.org/html/2406.07016v1). 14.2M PubMed abstracts,
   2010 to 2024. Published in Science Advances.
3. Juzek, T. and Ward, Z. [Why Does ChatGPT "Delve" So Much? Exploring the Sources
   of Lexical Overrepresentation in Large Language Models](https://arxiv.org/html/2412.11385v1),
   Florida State University.
4. Reinhart, A., et al. [Do LLMs write like humans? Variation in grammatical and
   rhetorical styles](https://www.pnas.org/doi/10.1073/pnas.2422455122), PNAS
   122(8), 2025. Preprint: [arXiv:2410.16107](https://arxiv.org/abs/2410.16107).
5. Muñoz-Ortiz, A., et al. [Contrasting Linguistic Patterns in Human and
   LLM-Generated News Text](https://link.springer.com/article/10.1007/s10462-024-10903-2),
   Artificial Intelligence Review, Springer.
6. Orwell, G. [Politics and the English Language](https://americanliterature.com/author/george-orwell/essay/politics-and-the-english-language),
   Horizon, 1946.

Secondary: TechCrunch, [The best guide to spotting AI writing comes from
Wikipedia](https://techcrunch.com/2025/11/20/the-best-guide-to-spotting-ai-writing-comes-from-wikipedia/).
