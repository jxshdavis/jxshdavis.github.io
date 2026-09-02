---
title: "Rademacher Complexity Bounds for Concrete Models and Losses"
date: 2026-08-29
modified: 2026-08-29
permalink: /machine-learning-almanac/stat241a/rademacher-complexity-bounds
tags:
  - Learning Theory
  - STAT 241A
  - Rademacher Complexity
excerpt: "Annotated study notes on Ma Chapter 5: margin theory, Rademacher complexity of linear models and two-layer nets, and the covering-number route to deep nets."
toc: false
author_profile: false
sidebar:
  title: "ML Almanac"
  nav: sidebar-almanac
---

<!--
  Background / prerequisite material for STAT 241A, from handwritten notes on
  Tengyu Ma Ch. 5, expanded in conversation with Claude.
  Annotation key:
    📌          — annotations carried over from the source notes (Josh's margin
                  notes, some developed with Claude in earlier sessions).
    ✏️ Josh     — Josh's personal to-dos, to resolve while polishing.
    🤖 Claude   — NEW annotations added during this conversion. Delete or absorb freely.
  210B references link to the STAT 210B Results Toolbox pages in the sidebar.
-->

<div style="border: 1.5px solid currentColor; border-radius: 4px; padding: 0.9em 1.1em; margin: 1.2em 0;">
<strong>Attribution &amp; disclaimer.</strong> These my personal study notes on Chapter 5 of Tengyu Ma's fantastic <a href="https://web.stanford.edu/class/stats214/">Lecture Notes for Machine Learning Theory (CS229M / STATS 214)</a>, which is stated prerequisite material for STAT 241A. Substantial portions of the definitions, theorem statements, equations, and some prose are reproduced <em>verbatim or near-verbatim</em> from Ma's notes; equation numbers (5.x) are Ma's, so everything can be cross-referenced directly against the original. The annotations, figures, and cross-references to my STAT 210B notes are my own from the Spring 2026 iteration taught by Nikita Zhivotovskiy. These notes are posted for personal study and are not a substitute for the original. Please read Ma's notes.
</div>

Ma's chapter 5 has two main focuses:

1. Rademacher complexity for two important hypothesis classes: linear models and two-layer neural networks.
2. Develop margin theory for bounding the generalization gap for binary classifiers.

> 📌 **Scope note.** The running setting of this chapter is binary classification — \\(y\in\\{\pm1\\}\\), \\(0/1\\) loss — and generalization always enters through margin theory: every final "generalization loss \\(\le\\)" display below, (5.13), (5.40), (5.76), (5.102), is a bound on classification error. 

> 📌 What is a hypothesis class? A set \\(\mathcal{H}\\) of candidate predictors \\(h:\mathcal{X}\to\mathcal{Y}\\), fixed *before* seeing the data. In our setting it is almost always a parametric family \\(\mathcal{H} = \\{h\_\theta : \theta\in\Theta\\}\\), and the constraint defining \\(\Theta\\) (a norm ball, say) is what all the complexity bounds below are actually measuring. The "fixed before seeing the data" part is not us trying to be unnecessarily precise. Remark 5.4 is a great illustration of a subltle place where you lose this property in the middle of a seeminlgy innocent analysis.

Since everything in this chapter is stated in terms of Rademacher complexity, we include two important defintions. The primary reference is my STAT 210B notes, §7 ("Concentration Inequalities for Gaussian and Rademacher Processes"), where the quantity arises via [symmetrization]({{ site.baseurl }}/machine-learning-almanac/stat210b/symmetrization) as a bound on the excess risk of empirical risk minimization; see also Ma, Ch. 4.

**Definition (Empirical (sample) Rademacher complexity).** Let \\(\mathcal{F}\\) be a class of real-valued functions on a domain \\(\mathcal{Z}\\), and let \\(S = (z\_1,\dots,z\_n) \in \mathcal{Z}^n\\) be a fixed sample. The *empirical Rademacher complexity* of \\(\mathcal{F}\\) with respect to \\(S\\) is

$$
R_S(\mathcal{F}) \triangleq \mathbb{E}_{\sigma}\left[\sup_{f\in\mathcal{F}}\frac1n\sum_{i=1}^n \sigma_i f(z_i)\right],
$$

where \\(\sigma\_1,\dots,\sigma\_n\\) are i.i.d. Rademacher signs, \\(\mathbb{P}(\sigma\_i = 1) = \mathbb{P}(\sigma\_i = -1) = \tfrac12\\), independent of everything else.

**Definition (Average (population) Rademacher complexity).** If the sample is drawn as \\(z\_1,\dots,z\_n \overset{\mathrm{iid}}{\sim} P\\), the *average Rademacher complexity* of \\(\mathcal{F}\\) at sample size \\(n\\) is

$$
R_n(\mathcal{F}) \triangleq \mathbb{E}_{S\sim P^n}\big[R_S(\mathcal{F})\big],
$$

i.e. the empirical Rademacher complexity averaged over the draw of the sample.

> 📌 What does it measure?  \\(R\_S(\mathcal{F})\\) measures how well \\(\mathcal{F}\\) can line up with the \\(2^n\\) possible sign patterns of \\((\sigma\_1,\dots,\sigma\_n)\\). The idea is that a more expressive class can correlate with more of these random directions, so it has larger Rademacher complexity. Since the Rademacher sign's are just random noise, we can also think of the Rademacher complexity as a measure of the model classes ability to fit (or overfit) to random noise.

> 📌 One observation about Rademacher Complexity which is relevant to §5.3.1 later. \\(R\_S(\mathcal{F})\\) depends on \\(\mathcal{F}\\) only through the output set \\(Q = \\{(f(z\_1),\dots,f(z\_n))^\top : f\in\mathcal{F}\\}\subseteq\mathbb{R}^n\\), since \\(R\_S(\mathcal{F}) = \mathbb{E}\_\sigma\big[\sup\_{v\in Q}\frac1n\langle\sigma,v\rangle\big]\\) (Ma, (4.98)–(4.99)). So Rademacher complexity sees the *functions* a class can realize and nothing about how they are parameterized. Two parameterizations with the same \\(Q\\) have the same complexity.

## Margin theory

> **Assumption 1.** The dataset \\(D = ((x^{(1)},y^{(1)}),\dots,(x^{(n)},y^{(n)}))\\) is completely separable. That is, there exists some \\(h\_\theta\in\mathcal{H}\\) such that \\(y^{(i)} = \operatorname{sgn}(h\_\theta(x^{(i)}))\\) for all \\(i=1,\dots,n\\).

Here \\(\mathcal{H}\\) is a parametric family indexed by \\(\theta\\). Separability is not a necessary condition, but it makes the final bound derivation cleaner.

**Definition ((Unnormalized) margin; Ma 5.1).** Fix the hypothesis \\(h\_\theta\\). The *(unnormalized) margin* for the example \\((x,y)\\) is

$$
\operatorname{margin}(x) \triangleq y\,h_\theta(x).
$$

Margin is only defined on examples where \\(\operatorname{sgn}(h\_\theta(x)) = y\\). Under Assumption 1, \\(\operatorname{margin}(x)\ge 0\\) on the training set.

Context: \\(y\in\\{1,-1\\}\\) and \\(h\_\theta(x)\in\mathbb{R}\\).

> 📌 Why does this definition make sense? Because \\(h\_\theta(x)\\) carries two pieces of information that the sign alone throws away: *which* side of the boundary we are on, and *how far*. Multiplying by \\(y\in\\{\pm1\\}\\) keeps the magnitude and converts the sign into a correctness indicator, so \\(yh\_\theta(x)>0\\) means correct and, heuristically speaking, \\(\lvert yh\_\theta(x)\rvert\\) measures confidence. In this definition we are taking \\(h\_\theta\\) to be a hypothesis that separates the data, whose existence Assumption 1 asserts.

**Definition (Minimum margin; Ma 5.2).** Given a dataset \\(D\\), the *minimum margin* over the dataset is

$$
\gamma_{\min} \triangleq \min_{i\in[n]} y^{(i)}h_\theta(x^{(i)}).
$$

Looking ahead, the final bound will be of the form

$$
(\text{generalization gap}) \;\le\; f(\text{margin},\ \text{parameter norm}).
$$

This is generic: many bounds are available depending on which margin we use. Here we use \\(\gamma\_{\min}\\), but other settings use \\(\gamma\_{\text{average}}\\), the average margin over the dataset.





> 📌 *Intuition.* Classifiers with larger margins are better, in terms of generalization, even if the training loss does not change. The picture I have in mind is the one dimension SVM perfectly separating data. You can choose many possible models which separate the data but the one with the largest margin intuitivley feels strongest. To be precise, under Assumption 1 every hypothesis we are comparing has training \\(0/1\\) error exactly zero, so training loss cannot distinguish them at all. The bound (5.13) still separates them, and it does so using a quantity (\\(\gamma\_{\min}\\)). This is the same phenomenon as the AdaBoost observation that test error keeps falling after training error hits zero.

### Surrogate loss

The idea of a surrogate loss is that it approximates the \\(0/1\\) loss but takes the scale of the margin into account. The *margin loss* (or *ramp loss*) is defined as

$$
\ell_\gamma(t) =
\begin{cases}
0, & t \ge \gamma,\\
1, & t \le 0,\\
1 - t/\gamma, & 0\le t\le \gamma.
\end{cases}
\tag{5.1}
$$

<figure style="margin: 1.2em 0; text-align: center;">
<svg viewBox="0 0 460 215" role="img" aria-label="Ramp loss versus 0/1 loss" style="max-width: 460px; width: 100%; height: auto;">
  <!-- axes -->
  <line x1="20" y1="160" x2="440" y2="160" stroke="currentColor" stroke-width="1.2"/>
  <polygon points="440,160 432,156 432,164" fill="currentColor"/>
  <line x1="140" y1="195" x2="140" y2="30" stroke="currentColor" stroke-width="1.2"/>
  <polygon points="140,30 136,38 144,38" fill="currentColor"/>
  <text x="447" y="175" font-size="13" fill="currentColor" text-anchor="end" font-style="italic">t = yh(x)</text>
  <!-- ticks -->
  <line x1="220" y1="156" x2="220" y2="164" stroke="currentColor" stroke-width="1.2"/>
  <text x="220" y="180" font-size="13" fill="currentColor" text-anchor="middle" font-style="italic">&gamma;</text>
  <line x1="136" y1="80" x2="144" y2="80" stroke="currentColor" stroke-width="1.2"/>
  <text x="128" y="84" font-size="13" fill="currentColor" text-anchor="end">1</text>
  <line x1="140" y1="80" x2="220" y2="80" stroke="currentColor" stroke-width="0.8" stroke-dasharray="3,3" opacity="0.4"/>
  <!-- 0/1 loss (dashed) -->
  <line x1="40" y1="87" x2="140" y2="87" stroke="#c05050" stroke-width="2.6" stroke-dasharray="7,5"/>
  <line x1="140" y1="166" x2="420" y2="166" stroke="#c05050" stroke-width="2.6" stroke-dasharray="7,5"/>
  <circle cx="140" cy="166" r="3.2" fill="#c05050"/>
  <circle cx="140" cy="87" r="3.2" fill="none" stroke="#c05050" stroke-width="1.6"/>
  <!-- ramp loss (solid) -->
  <polyline points="40,80 140,80 220,160 420,160" fill="none" stroke="#4878c0" stroke-width="2.8"/>
  <!-- legend -->
  <line x1="270" y1="45" x2="305" y2="45" stroke="#4878c0" stroke-width="2.8"/>
  <text x="312" y="49" font-size="13" fill="currentColor">&#8467;<tspan baseline-shift="sub" font-size="10">&gamma;</tspan> (margin / ramp loss)</text>
  <line x1="270" y1="67" x2="305" y2="67" stroke="#c05050" stroke-width="2.6" stroke-dasharray="7,5"/>
  <text x="312" y="71" font-size="13" fill="currentColor">&#8467;<tspan baseline-shift="sub" font-size="10">0-1</tspan></text>
</svg>
<figcaption style="font-size: 0.9em; opacity: 0.85; max-width: 560px; margin: 0.4em auto 0;">The margin loss \(\ell_\gamma\) (solid) upper bounds the \(0/1\) loss (dashed) everywhere, and interpolates linearly on \([0,\gamma]\) instead of jumping at \(t=0\).</figcaption>
</figure>

> 📌 Two things the picture makes obvious. (i) \\(\ell\_\gamma \ge \ell\_{0\text{-}1}\\) pointwise, which is (5.2) and is the only property used to pass to the population bound. (ii) \\(\ell\_\gamma\\) is \\(\frac1\gamma\\)-Lipschitz because the only sloped piece has slope \\(\tfrac{-1}{\gamma}\\), whereas \\(\ell\_{0\text{-}1}\\) is not Lipschitz at all — it is discontinuous at \\(0\\). That is the trade: we give up tightness of the loss function on \\([0,\gamma]\\) and buy bound in terms of a finite Lipschitz constant. Smaller \\(\gamma\\) means a tighter surrogate but a worse Lipschitz constant, and the tradeoff between those two is resolved by taking \\(\gamma = \gamma\_{\min}\\), the largest \\(\gamma\\) that still zeroes out the empirical term.

Define \\(\ell\_\gamma((x,y),h) \triangleq \ell\_\gamma(yh(x))\\).

We can think of \\(\ell\_\gamma\\) as a continuous version of the \\(0/1\\) loss that is sensitive to what the margin is. For all \\((x,y)\\),

$$
\ell_{0\text{-}1}((x,y),h) = \mathbf{1}\{yh(x) < 0\} \;\le\; \ell_\gamma(yh(x)) = \ell_\gamma((x,y),h).
\tag{5.2}
$$

Thus

$$
\mathbb{E}\,\ell_{0\text{-}1}((x,y),h) \;\le\; \mathbb{E}\,\ell_\gamma((x,y),h) \triangleq L_\gamma(h),
\tag{5.3}
$$

so we can use the surrogate risk to bound the risk we care about.

The empirical version of the margin loss is

$$
\widehat L_\gamma(h) = \frac1n\sum_{i=1}^n \ell_\gamma\big((x^{(i)},y^{(i)}),h\big).
\tag{5.4}
$$

> 📌 Notation, since \\(\ell\\) and \\(L\\) are both overloaded. There are three distinct objects and \\(\gamma\\) is a subscript on all of them:
>
> - \\(\ell\_\gamma:\mathbb{R}\to[0,1]\\) is the scalar function drawn above, (5.1). Its argument is a real number.
> - \\(\ell\_\gamma((x,y),h)\\) is that same function evaluated at the margin, \\(t = yh(x)\\). This is a per-example loss, so it takes an example and a hypothesis and returns a number in \\([0,1]\\).
> - \\(L\_\gamma(h) = \mathbb{E}\,\ell\_\gamma((x,y),h)\\) is the population margin risk and \\(\widehat L\_\gamma(h)\\) is its empirical average. Capital \\(L\\) is a risk (an average of losses), lowercase \\(\ell\\) is a loss (one example).


By the Rademacher generalization bound (Ma, Thm. 4.18 and Cor. 4.19), with probability at least \\(1-\delta\\),

$$
L_\gamma(h) - \widehat L_\gamma(h) \;\le\; 2R_S(\mathcal{F}) + 3\sqrt{\frac{\log(2/\delta)}{2n}},
\tag{5.5}
$$

where \\(\mathcal{F} = \\{(x,y)\mapsto \ell\_\gamma((x,y),h) : h\in\mathcal{H}\\}\\).

<div style="border: 1.5px solid currentColor; border-radius: 4px; margin: 1.2em 0;">
<div style="padding: 0.4em 1.1em; border-bottom: 1.5px solid currentColor; font-weight: 700;">This is the fundamental step</div>
<div style="padding: 0.75em 1.1em;" markdown="1">
Everything after this point is bookkeeping for \\(R\_S\\). (5.5) is where the statistics happens: it converts a statement about *one* fixed \\(h\\) (a concentration inequality) into a statement holding *simultaneously for all* \\(h\in\mathcal{H}\\), at a price of \\(2R\_S(\mathcal{F})\\). Concretely, the one-\\(h\\) statement is just Hoeffding: fix \\(h\\) *before seeing the data*; then the values \\(\ell\_\gamma((x^{(i)},y^{(i)}),h)\\) are i.i.d. in \\([0,1]\\), so with probability \\(1-\delta\\), \\(L\_\gamma(h) - \widehat L\_\gamma(h) \le \sqrt{\log(1/\delta)/2n}\\) — no \\(\sup\\), no dependence on \\(\mathcal{H}\\). That bound does not apply to the learned \\(\hat h\\), which is chosen *after* seeing the data precisely to make \\(\widehat L\_\gamma\\) small; (5.5) fixes this by bounding \\(\sup\_{h}\big[L\_\gamma(h) - \widehat L\_\gamma(h)\big]\\), so it covers \\(\hat h\\) in particular. One interpretation of (5.5) is, the more "Rademacher Complex" the function class is, the less we can say about the closeness of the empirical loss and the expected loss uniformly across all functions in the model class. Its proof (Ma, Thm. 4.18) has four moves, and all four ingredients are in my 210B notes:

1. Let \\(g(z\_1,\dots,z\_n) = \sup\_{f\in\mathcal{F}}\big[\frac1n\sum\_i f(z\_i) - \mathbb{E} f\big]\\). Changing one \\(z\_i\\) moves \\(g\\) by at most \\(1/n\\), so [McDiarmid]({{ site.baseurl }}/machine-learning-almanac/stat210b/mcdiarmid) applies: \\(g \le \mathbb{E} g + \epsilon\\) with probability \\(1-e^{-2n\epsilon^2}\\). (210B Prop. 2.45, bounded differences.)
2. [Symmetrization]({{ site.baseurl }}/machine-learning-almanac/stat210b/symmetrization): \\(\mathbb{E} g \le 2R\_n(\mathcal{F})\\). (210B Prop. 6.3; also the roadmap in 210B Remark 6.25, where this is the first of the three arrows.)
3. McDiarmid again, applied to \\(R\_S(\mathcal{F})\\) itself, to replace \\(R\_n\\) by the computable \\(R\_S\\): \\(R\_n \le R\_S + \epsilon\\).
4. Choose \\(\epsilon = \sqrt{\log(2/\delta)/2n}\\) and collect the three \\(\epsilon\\)'s into the constant \\(3\\).

The 210B version in §7.1 is the in-expectation statement,
\\(\mathbb{E}[R(\hat f) - \inf\_{f\in\mathcal{F}} R(f)] \le 2\,\mathbb{E}\sup\_{f}\lvert R(f) - R\_n(f)\rvert \le 4\,\mathbb{E}\sup\_{f}\big\lvert\frac1n\sum\_i \epsilon\_i \ell(f(X\_i),Y\_i)\big\rvert\\),
and, on the notes' one-sided "another route" (no absolute values), the Lipschitz-composition step
\\(2\,\mathbb{E}\sup\_f\big(\frac1n\sum\_i\epsilon\_i \ell(f(X\_i),Y\_i)\big) \le 2L\,\mathbb{E}\sup\_f\big(\frac1n\sum\_i\epsilon\_i f(X\_i)\big)\\) — which is [Talagrand's lemma]({{ site.baseurl }}/machine-learning-almanac/stat210b/talagrand-contraction), used there for exactly the reason we use it below. What 210B does not assemble is the high-probability, empirical-\\(R\_S\\) form; that packaging is Ma's Thm. 4.18. Cite 210B Prop. 6.3 for the symmetrization (§7.1 for the excess-risk chain that uses it) and Prop. 2.45 for McDiarmid, Ma 4.18 for the statement as used here.
</div>
</div>



**Lemma (Talagrand's lemma / contraction; Ma 5.3).** Let \\(\phi:\mathbb{R}\to\mathbb{R}\\) be \\(\kappa\\)-Lipschitz. Then

$$
R_S(\phi\circ\mathcal{H}) \;\le\; \kappa\, R_S(\mathcal{H}),
\tag{5.6}
$$

where \\(\phi\circ\mathcal{H} = \\{z\mapsto \phi(h(z)) : h\in\mathcal{H}\\}\\). See my [STAT 210B notes, §7 ("Ledoux–Talagrand construction")]({{ site.baseurl }}/machine-learning-almanac/stat210b/talagrand-contraction), for a proof of the \\(1\\)-Lipschitz version over \\(T\subseteq\mathbb{R}^n\\); (5.6) follows by rescaling and taking \\(T=\\{(h(z\_1),\dots,h(z\_n)):h\in\mathcal{H}\\}\\).



Apply this with \\(\phi(t) = \ell\_\gamma(t)\\), which is \\(\tfrac1\gamma\\)-Lipschitz, and \\(\mathcal{F} = \ell\_\gamma\circ\mathcal{H}'\\) where \\(\mathcal{H}' = \\{(x,y)\mapsto yh(x) : h\in\mathcal{H}\\}\\). The full derivation:

$$
\begin{aligned}
R_S(\mathcal{F}) &\le \frac1\gamma R_S(\mathcal{H}') && (5.7)\\
&= \frac1\gamma \mathbb{E}_{\sigma_1,\dots,\sigma_n}\left[\sup_{h\in\mathcal{H}}\frac1n\sum_{i=1}^n \sigma_i y^{(i)}h(x^{(i)})\right] && (5.8)\\
&= \frac1\gamma \mathbb{E}_{\sigma_1,\dots,\sigma_n}\left[\sup_{h\in\mathcal{H}}\frac1n\sum_{i=1}^n \sigma_i h(x^{(i)})\right] && (5.9)\\
&= \frac1\gamma R_S(\mathcal{H}). && (5.10)
\end{aligned}
$$

> 📌 Interpretation of the one step that is not bookkeeping: (5.8) to (5.9) drops the labels entirely. This works because \\(y^{(i)}\in\\{\pm1\\}\\) and \\(\sigma\_i\\) is a symmetric sign, so \\(\sigma\_i y^{(i)} \overset{d}{=} \sigma\_i\\), and the two collections are equal in joint distribution since the \\(\sigma\_i\\) are independent. So \\(R\_S\\) of the label-weighted class equals \\(R\_S\\) of the raw class: *Rademacher complexity of \\(\mathcal{H}\\) does not see the labels at all*. The complexity term measures how well the hypothesis class can correlate with pure noise on the given inputs, which is why the same \\(R\_S(\mathcal{H})\\) shows up regardless of what the \\(y^{(i)}\\) are.

Putting it together, for \\(\gamma = \gamma\_{\min}\\),

$$
\begin{aligned}
L_{0\text{-}1}(h) \le L_\gamma(h)
&\le \underbrace{\widehat L_{\gamma_{\min}}(h)}_{=\,0} + O\!\left(\frac{R_S(\mathcal{H})}{\gamma}\right) + \widetilde O\!\left(\sqrt{\frac{\log(2/\delta)}{2n}}\right) && (5.11)\\
&= O\!\left(\frac{R_S(\mathcal{H})}{\min_i y^{(i)}h(x^{(i)})}\right) + \widetilde O\!\left(\sqrt{\frac{\log(2/\delta)}{2n}}\right), && (5.12)
\end{aligned}
$$

with probability at least \\(1-\delta\\), where \\(R\_S(\mathcal{H})\\) is the empirical Rademacher complexity of \\(\mathcal{H}\\).

> 📌 Spelling out the \\(0\\), since it kinda just deletes a term and I wanna be clear on why its valid. Rearranging (5.5) gives \\(L\_\gamma(h) \le \widehat L\_\gamma(h) + 2R\_S(\mathcal{F}) + 3\sqrt{\log(2/\delta)/2n}\\); the leading term is the *empirical* margin risk, not \\(0\\). It becomes \\(0\\) only after we choose \\(\gamma = \gamma\_{\min}\\):
>
> $$
> \widehat L_{\gamma_{\min}}(h) = \frac1n\sum_{i=1}^n \ell_{\gamma_{\min}}\big(y^{(i)}h(x^{(i)})\big) = 0
> $$
>
> because every training margin satisfies \\(y^{(i)}h(x^{(i)})\ge\gamma\_{\min}\\) by definition of the minimum, and \\(\ell\_\gamma(t) = 0\\) for \\(t\ge\gamma\\) — the flat right piece of the ramp in the figure. So \\(\gamma\_{\min}\\) is exactly the largest threshold at which every point still sits in the 0 region. Then note where \\(\gamma\\) goes in the *second* term: (5.7) contributed a factor \\(1/\gamma\\), so choosing \\(\gamma\\) large shrinks the complexity term. The two effects pull in opposite directions — larger \\(\gamma\\) shrinks \\(R\_S(\mathcal{F})\\) but eventually makes \\(\widehat L\_\gamma > 0\\) — and \\(\gamma = \gamma\_{\min}\\) is the corner where the first term is still exactly zero. That single choice is what turns (5.5) into (5.13), and it is why \\(\gamma\_{\min}\\) rather than any other margin appears in the denominator.

In summary,

$$
\text{generalization loss} \;\le\; \frac{2R_S(\mathcal{H})}{\gamma_{\min}} + \text{low-order term}.
\tag{5.13}
$$

> "This bound states that simpler models will generalize better beyond the training data, particularly for data that is strongly separable."

**Remark (Ma 5.4).** If the dataset is random, so is \\(\gamma\_{\min}\\). This is not valid when thinking about Rademacher complexity.

> 📌 Why it is not valid, spelled out. Two separate failures, both from the same cause. (i) We applied Talagrand's lemma with \\(\kappa = 1/\gamma\\), but the lemma requires a deterministic Lipschitz constant — a random \\(\kappa\\) means the function class \\(\mathcal{F} = \ell\_\gamma\circ\mathcal{H}'\\) is itself data-dependent, and \\(R\_S\\) is only defined for a class fixed in advance. (ii) The concentration inequality behind (5.5) needs the summands \\(\ell\_\gamma((x^{(i)},y^{(i)}),h)\\) to be independent, which fails once \\(\gamma\\) is a function of the whole sample. This is the same pathology as term (1) of the [excess-risk decomposition]({{ site.baseurl }}/machine-learning-almanac/stat241a/learning-as-optimization): the moment the object depends on the sample, you cannot use a pointwise inequality, and you have to pay for uniformity.

There is a fix via a union bound argument. Take \\(\Gamma = \\{2^k : k\in[-B,B]\\}\\). For each fixed \\(\gamma\in\Gamma\\) the bound (5.5) holds with probability \\(\ge 1-\delta\\); a union bound over \\(\Gamma\\) gives, for all \\(\gamma\in(0,B)\\),

$$
L_{0\text{-}1}(h) \le \widehat L_\gamma(h) + O\!\left(\frac{R_S(\mathcal{H})}{\gamma}\right)
+ \widetilde O\!\left(\sqrt{\frac{\log(1/\delta)}{n}}\right)
+ \widetilde O\!\left(\sqrt{\frac{\log B}{n}}\right).
\tag{5.15}
$$

Then choose the largest \\(\gamma\in\Gamma\\) with \\(\gamma\le\gamma\_{\min}\\). The extra \\(\widetilde O(\sqrt{\log B/n})\\) is the price of the uniform convergence argument needed to correct the heuristic bound (5.13).

### Takeaways from the union-bound fix

<!-- Per Josh's annotation in the source notes, the full formal proof of the
     union-bound fix (Lemma on ramp monotonicity + Proposition with the six-step
     proof) is deliberately OMITTED from this post: "I want to omit this proof
     since I have not read it in full myself yet. I may never read it in full
     but I like having it here just in case." It lives in the LaTeX source.
     The two structural takeaway annotations below are kept because they are
     digestible summaries, not the proof itself. 🤖 Adjust if you'd rather cut
     these too. -->

*The full proof of the fix is written out in my LaTeX notes but omitted here (I haven't read it in full myself yet). Two structural takeaways are worth keeping:*

> 📌 How is randomness causing a problem? Random data makes \\(\gamma\\) random which means the *function class* \\(\mathcal{F}\_\gamma\\) is also random, and every tool in Chapter 4 — symmetrization, the contraction lemma, the definition of \\(R\_S\\) itself — presupposes a class fixed before the draw. The union bound repairs exactly this: each \\(\mathcal{F}\_\gamma\\) for \\(\gamma\\) in the grid is deterministic, and the only randomness in the final step is *which* of finitely many deterministic statements we invoke.

> 📌  The fix is cheap. The union bound argument takes quite a bit of ink to spell out but for now just know we don't have to worry too much about it ruining the main takeaways we are trying to get from this section.

## Linear models

### Weights bounded in \\(\ell\_2\\) norm

**Theorem (Ma 5.5).** Let the hypothesis class be \\(\mathcal{H} = \\{x\mapsto \langle w,x\rangle : w\in\mathbb{R}^d,\ \lVert w\rVert\_2\le B\\}\\). Moreover assume \\(\mathbb{E}\_{x\sim P}[\lVert x\rVert\_2^2]\le C^2\\), where \\(P\\) is some distribution and \\(C>0\\) is a constant. Then

$$
R_S(\mathcal{H}) \;\le\; \frac{B}{n}\sqrt{\sum_{i=1}^n \lVert x^{(i)}\rVert_2^2},
\tag{5.16}
$$

and

$$
R_n(\mathcal{H}) \;\le\; \frac{BC}{\sqrt n}.
\tag{5.17}
$$

Generally, there are two methods for bounding the Rademacher complexity of a model.

1. First, we can discretize the space of possible outputs from our hypothesis class, and then use a union bound or covering number argument to bound the Rademacher complexity of the model. This method gives bounds which depend on the \\(\log(\text{size of discretized output space})\\), which depends on the data size \\(n\\).
2. The second method is more limited but does not depend on the discretization. We follow this second path below:

*Proof.*

$$
\begin{aligned}
R_S(\mathcal{H}) &= \mathbb{E}_\sigma\left[\sup_{\lVert w\rVert_2\le B}\frac1n\sum_{i=1}^n \sigma_i\langle w,x^{(i)}\rangle\right] && (5.18)\\
&= \frac1n\mathbb{E}_\sigma\left[\sup_{\lVert w\rVert_2\le B}\Big\langle w, \sum_{i=1}^n \sigma_i x^{(i)}\Big\rangle\right] && (5.19)\\
&= \frac{B}{n}\mathbb{E}_\sigma\left[\Big\lVert\sum_{i=1}^n \sigma_i x^{(i)}\Big\rVert_2\right] && (5.20)\\
&\le \frac{B}{n}\sqrt{\mathbb{E}_\sigma\Big\lVert\sum_{i=1}^n \sigma_i x^{(i)}\Big\rVert_2^2} && (5.21)\\
&= \frac{B}{n}\sqrt{\mathbb{E}_\sigma\left[\sum_{i=1}^n \left(\sigma_i^2\lVert x^{(i)}\rVert_2^2 + \Big\langle \sigma_i x^{(i)}, \sum_{j\ne i}\sigma_j x^{(j)}\Big\rangle\right)\right]} && (5.22)\\
&= \frac{B}{n}\sqrt{\sum_{i=1}^n \lVert x^{(i)}\rVert_2^2}. && (5.23)
\end{aligned}
$$

My annotations on the steps:

- (5.18) is by definition of \\(R\_S(\mathcal{H})\\).
- (5.19) by linearity — pull the sum inside the inner product, and the \\(1/n\\) outside the sup.
- (5.20) sup characterization of the norm: \\(\sup\_{\lVert w\rVert\_2\le B}\langle w,v\rangle = B\lVert v\rVert\_2\\), attained at \\(w = Bv/\lVert v\rVert\_2\\). This is Cauchy–Schwarz with equality, i.e. \\(\ell\_2\\) is self-dual.
- (5.21) Jensen's inequality for \\(a\mapsto a^2\\) (equivalently, \\(\mathbb{E} Z\le\sqrt{\mathbb{E} Z^2}\\)).
- (5.22) algebraic expansion of the norm\\(^2\\) of a sum.
- (5.23) \\(\sigma\_i^2 = 1\\), and the cross terms vanish because the \\(\sigma\_i\\) are independent with \\(\mathbb{E}[\sigma\_i] = 0\\).

<details style="border: 1.5px solid currentColor; border-radius: 4px; margin: 1.2em 0; padding: 0;">
<summary style="padding: 0.4em 1.1em; font-weight: 700; cursor: pointer;">🤖 Why is the only inequality Jensen's, and what does it cost?</summary>
<div style="padding: 0.75em 1.1em; border-top: 1.5px solid currentColor;" markdown="1">
Jensen is everywhere in 210B because it is the one-way bridge from the moment you *want* to the moment you can *compute*. First moments of nonlinear functionals (norms, maxima, sups) almost never have closed forms; second moments of Rademacher sums are pure linear algebra — expand the square and every cross term \\(\mathbb{E}[\sigma\_i\sigma\_j]\\), \\(i\ne j\\), dies by independence, which is exactly (5.22)→(5.23). So (5.21) converts a probability question into an algebra question. The same move powers the [maximal inequality]({{ site.baseurl }}/machine-learning-almanac/stat210b/maximal-inequality) (Jensen through \\(\log/\exp\\)) and every Chernoff argument.

What is given up is exactly the variance of the quantity under the square. For \\(Z = \lVert\sum\_i\sigma\_i x^{(i)}\rVert\_2\\),

$$
\mathbb{E}Z^2 = (\mathbb{E}Z)^2 + \operatorname{Var}(Z),
\qquad
\frac{\sqrt{\mathbb{E}Z^2}}{\mathbb{E}Z} = \sqrt{1 + \frac{\operatorname{Var}(Z)}{(\mathbb{E}Z)^2}},
$$

with equality iff \\(Z\\) is a.s. constant. So Jensen is lossless precisely when \\(Z\\) concentrates at the scale of its own mean.

Here a theorem certifies the loss is only a constant: the **Khintchine–Kahane inequality** makes the bridge two-way for Rademacher sums, with best \\(L^1\\)–\\(L^2\\) constant \\(\sqrt2\\):

$$
\frac{1}{\sqrt 2}\sqrt{\textstyle\sum_i \lVert x^{(i)}\rVert_2^2}
\;\le\; \mathbb{E}\Big\lVert\sum_i \sigma_i x^{(i)}\Big\rVert_2
\;\le\; \sqrt{\textstyle\sum_i \lVert x^{(i)}\rVert_2^2}.
$$

So (5.21) costs at most \\(\sqrt2\\) and the rate in (5.23) is exactly right. This is the general pattern underwriting 210B's free use of Jensen: for the random objects the course works with (Rademacher/Gaussian sums, Lipschitz functionals of them), concentration of measure guarantees \\(\operatorname{Var}(Z)\ll(\mathbb{E}Z)^2\\), so moment comparisons bleed only universal constants.

When to actually be suspicious of a Jensen step: audit \\(\operatorname{Var}(Z)/(\mathbb{E}Z)^2\\) for the thing under the convex function. It genuinely hurts when applied under an exponential to something heavy-tailed that does not concentrate (why sub-exponential variables get the [Bernstein]({{ site.baseurl }}/machine-learning-almanac/stat210b/bernstein) treatment rather than a naive Chernoff), when iterated so the \\(\sqrt2\\)'s stack, or when a max/sup is dominated by rare spikes so the first and second moments live at different scales. None of those apply in (5.18)–(5.23).
</div>
</details>

Proof of the empirical Rademacher complexity done. For the average Rademacher complexity just take expectations of both sides w.r.t. \\(x\sim P\\):

$$
R_n(\mathcal{H}) = \mathbb{E}[R_S(\mathcal{H})] = \frac{B}{n}\mathbb{E}\left[\sqrt{\sum_i \lVert x^{(i)}\rVert_2^2}\right]
\le \frac{B}{n}\sqrt{\sum_i \mathbb{E}\lVert x^{(i)}\rVert_2^2} \le \frac{BC}{\sqrt n},
\tag{5.24}
$$

where the first inequality is Jensen again and the second uses \\(\mathbb{E}\lVert x\rVert\_2^2\le C^2\\).

*Observation.* Both the empirical and average Rademacher complexities scale with \\(B\\), which motivates model regularization. But smaller weights may reduce \\(\gamma\_{\min}\\), which can hurt generalization according to the bound

$$
\text{generalization loss} \;\le\; \frac{2R_S(\mathcal{H})}{\gamma_{\min}} + \text{lower-order terms}.
$$

> 📌 Ma's Remark 5.6 makes the scaling consistent: if you rescale the data by a constant, \\(R\_S(\mathcal{H})\\) scales by that constant, but so does \\(\gamma\_{\min}\\), so the ratio — and hence the bound — is unchanged. Good sanity check that the bound is measuring something real rather than an artifact of units.

### Weights bounded in \\(\ell\_1\\) norm

**Theorem (Ma 5.7).** Let \\(\mathcal{H} = \\{x\mapsto\langle w,x\rangle : w\in\mathbb{R}^d,\ \lVert w\rVert\_1\le B\\}\\) for some \\(B>0\\). Also assume \\(\lVert x^{(i)}\rVert\_\infty\le C\\) for some \\(C>0\\) and all points in \\(S = \\{x^{(i)}\\}\_{i=1}^n\subseteq\mathbb{R}^d\\). Then

$$
R_S(\mathcal{H}) \;\le\; BC\sqrt{\frac{2\log(2d)}{n}}.
\tag{5.25}
$$

**Lemma (Massart's lemma; Ma 5.8).** Suppose \\(Q\subset\mathbb{R}^n\\) is finite and contained in the \\(\ell\_2\\)-norm ball of radius \\(M\sqrt n\\), i.e. \\(Q\subseteq\\{v\in\mathbb{R}^n : \lVert v\rVert\_2\le M\sqrt n\\}\\). Then for Rademacher variables \\(\sigma = (\sigma\_1,\dots,\sigma\_n)\\),

$$
\mathbb{E}_\sigma\left[\sup_{v\in Q}\frac1n\langle\sigma,v\rangle\right] \;\le\; M\sqrt{\frac{2\log\lvert Q\rvert}{n}}.
\tag{5.27}
$$

As a corollary, if \\(\mathcal{F}\\) is a set of real-valued functions with \\(\sup\_{f\in\mathcal{F}}\frac1n\sum\_i f(z^{(i)})^2 \le M^2\\), then \\(R\_S(\mathcal{F})\le M\sqrt{2\log\lvert\mathcal{F}\rvert/n}\\) and likewise for \\(R\_n\\).

> 📌 Ma states it as Lemma 5.8 and, in the \\(Q\\) formulation, as Proposition 4.6.1 and Corollary 4.21, and omits the proof both times. In my 210B notes the engine is [Proposition 2.40]({{ site.baseurl }}/machine-learning-almanac/stat210b/maximal-inequality): for zero-mean \\(\sigma\\)-sub-Gaussian \\(X\_1,\dots,X\_n\\) (not necessarily independent), \\(\mathbb{E}\max\_i X\_i \le \sigma\sqrt{2\log n}\\), proved by the exponential-moment / Jensen argument and optimizing in \\(\lambda\\). Remark 2.41(2) upgrades it to \\(\mathbb{E}\max\_i\lvert X\_i\rvert\le\sigma\sqrt{2\log(2n)}\\). Massart's lemma is exactly this applied to \\(X\_v = \frac1n\langle\sigma,v\rangle\\) for \\(v\in Q\\): each \\(X\_v\\) is \\(\frac{\lVert v\rVert\_2}{n}\\)-sub-Gaussian by Hoeffding, so \\(\mathbb{E}\sup\_v X\_v \le \frac{M\sqrt n}{n}\sqrt{2\log\lvert Q\rvert}\\). So 210B Prop. 2.40 gives the machinery, Ma Lemma 5.8 gives the statement in the form we see it here.

*Proof of Ma 5.7.* By definition,

$$
\begin{aligned}
R_S(\mathcal{H}) &= \mathbb{E}_\sigma\left[\sup_{\lVert w\rVert_1\le B}\frac1n\sum_{i=1}^n \sigma_i\langle w,x^{(i)}\rangle\right] && (5.30)\\
&= \frac1n\mathbb{E}_\sigma\left[\sup_{\lVert w\rVert_1\le B}\Big\langle w,\sum_{i=1}^n \sigma_i x^{(i)}\Big\rangle\right] && (5.31)\\
&= \frac{B}{n}\mathbb{E}_\sigma\left[\Big\lVert\sum_{i=1}^n \sigma_i x^{(i)}\Big\rVert_\infty\right]. && (5.32)
\end{aligned}
$$

Here (5.30) is by definition of \\(R\_S(\mathcal{H})\\), (5.31) is linearity, and (5.32) is \\(\ell\_1\\)–\\(\ell\_\infty\\) duality, \\(\sup\_{\lVert w\rVert\_1\le B}\langle w,v\rangle = B\lVert v\rVert\_\infty\\), a consequence of Hölder's inequality.

It is hard to simplify the \\(\ell\_\infty\\)-norm term further, so we can use something else: \\(\sup\_{\lVert w\rVert\_1\le1}\langle w,v\rangle\\) is attained at a vertex,

$$
w \in W = \bigcup_{i=1}^d \{-e_i, e_i\}.
$$

To use this, define the restricted hypothesis class \\(\overline{\mathcal{H}} = \\{x\mapsto\langle w,x\rangle : w\in W\\}\subseteq\mathcal{H}\\), which gives

$$
R_S(\mathcal{H}) = \frac{B}{n}\mathbb{E}_\sigma\left[\max_{w\in W}\Big\langle w,\sum_{i=1}^n \sigma_i x^{(i)}\Big\rangle\right] = B\,R_S(\overline{\mathcal{H}}).
\tag{5.35}
$$

\\(\overline{\mathcal{H}}\\) is bounded and has cardinality \\(2d\\), so we apply Massart. Check that Massart's hypotheses are verified: since the inner product of \\(x^{(i)}\\) with a coordinate vector \\(e\_j\\) just selects the \\(j\\)th coordinate,

$$
\frac1n\sum_{i=1}^n \langle w,x^{(i)}\rangle^2 \;\le\; \frac1n\sum_{i=1}^n \lVert x^{(i)}\rVert_\infty^2 \;\le\; C^2
\tag{5.36}
$$

for any \\(w\in W\\). Then

$$
R_S(\mathcal{H}) = B\,R_S(\overline{\mathcal{H}}) \le BC\sqrt{\frac{2\log\lvert\overline{\mathcal{H}}\rvert}{n}} = BC\sqrt{\frac{2\log(2d)}{n}}.
\tag{5.37}
$$

∎

### Comparing bounds for other \\(\mathcal{H}\\)

- For this hypothesis class of linear models we can get upper bounds proportional to \\(\sqrt{d/n}\\) using VC dimension.
- Our bounds do not have a strong dependence on \\(d\\), so they are better in this sense.
- To determine which hypothesis class is better, consider the bounds
  \\(\lVert w\rVert\_2\lVert x\rVert\_2\\) vs. \\(\lVert w\rVert\_1\lVert x\rVert\_\infty\\)
  and see how they compare in different settings.

Summary of the three settings:

1. **Generic entries.** Suppose \\(w\\) and \\(x\\) have entries close to \\(\\{-1,1\\}\\). Then we compare \\(\sqrt d\cdot\sqrt d\\) versus \\(d\cdot 1\\). There is no difference between the two hypothesis classes.
2. **Sparse \\(w\\).** If additionally \\(w\\) has at most \\(k\\) nonzero entries, we compare \\(\sqrt k\cdot\sqrt d\\) versus \\(k\cdot 1\\). For \\(d\gg k\\) we have \\(\sqrt{kd}\gg k\\), so \\(\ell\_1\\) regularization gives the better bound. Formally, \\(\sqrt d\lVert x\rVert\_\infty\approx\lVert x\rVert\_2\\) when the entries of \\(x\\) are roughly uniform, so

   $$
   \lVert w\rVert_2\lVert x\rVert_2 \ge \sqrt d\,\lVert w\rVert_2\lVert x\rVert_\infty \ge \lVert w\rVert_1\lVert x\rVert_\infty.
   \tag{5.38}
   $$

3. **Dense \\(w\\).** If \\(w\\) is dense in the sense that \\(\lVert w\rVert\_2\approx\frac{1}{\sqrt d}\lVert w\rVert\_1\\) (all entries close in magnitude), then

   $$
   \lVert w\rVert_2\lVert x\rVert_2 \le \frac{1}{\sqrt d}\lVert w\rVert_1\cdot\sqrt d\,\lVert x\rVert_\infty \le \lVert w\rVert_1\lVert x\rVert_\infty,
   \tag{5.39}
   $$

   and it makes sense to regularize the \\(\ell\_2\\) norm instead.

In practice other multiplicative factors enter the bound, so regularizing both norms is preferable.

If we consider the bounded \\(\ell\_2\\)-norm hypothesis class we get

$$
\text{generalization loss} \;\lesssim\; \frac{\lVert w\rVert_2\lVert x\rVert_2}{\sqrt n\,\gamma_{\min}} + \text{lower-order term}.
\tag{5.40}
$$

The presence of \\(\lVert w\rVert\_2/\gamma\_{\min}\\) motivates the minimum-norm and max-margin formulations of the SVM problem as good methods to improve the generalization performance of binary classifiers.

## Two-layer neural networks

Goal: compute the Rademacher complexity of two-layer neural networks.

*Notation.*

- \\(\theta = (w,U)\\) are the parameters, with \\(w\in\mathbb{R}^m\\) and \\(U\in\mathbb{R}^{m\times d}\\), where \\(m\\) is the number of hidden units. We write \\(u\_j\in\mathbb{R}^d\\) for the \\(j\\)th row of \\(U\\), viewed as a column vector.
- \\(\phi(z) = \max(z,0)\\) is the ReLU, applied element-wise.
- \\(f\_\theta(x) = \langle w,\phi(Ux)\rangle = w^\top\phi(Ux)\\) is the model.
- \\(\\{(x^{(i)},y^{(i)})\\}\_{i=1}^n\\) is the training set, \\(x^{(i)}\in\mathbb{R}^d\\), \\(y^{(i)}\in\mathbb{R}\\).

> 📌 What a two-layer net looks like, concretely. Input \\(x\in\mathbb{R}^d\\). The first layer applies \\(m\\) separate linear maps \\(x\mapsto\langle u\_j,x\rangle\\), one per hidden unit, giving the vector \\(Ux\in\mathbb{R}^m\\). Each coordinate is then passed through the ReLU, producing the *hidden layer* \\(\phi(Ux)\in\mathbb{R}^m\\). A *hidden unit* (or neuron) is one coordinate \\(j\\) of that vector: it computes \\(\phi(u\_j^\top x)\\), a single ridge function — linear in \\(x\\) along direction \\(u\_j\\), clipped at zero. The output layer takes a linear combination of the \\(m\\) hidden units with weights \\(w\\), giving a scalar. So the model is a weighted sum of \\(m\\) clipped ridge functions, \\(f\_\theta(x) = \sum\_{j=1}^m w\_j\phi(u\_j^\top x)\\), and \\(m\\) is the width. There is no nonlinearity on the output, and biases are suppressed throughout.

**Theorem (Weak bound; Ma 5.9).** For some constants \\(B\_w>0\\) and \\(B\_u>0\\), let

$$
\mathcal{H} = \{f_\theta \mid \lVert w\rVert_2\le B_w,\ \lVert u_i\rVert_2\le B_u,\ \forall i\in\{1,2,\dots,m\}\},
\tag{5.41}
$$

and suppose \\(\mathbb{E}[\lVert x\rVert\_2^2]\le C^2\\). Then

$$
R_n(\mathcal{H}) \;\le\; 2B_w B_u C\sqrt{\frac{m}{n}}.
\tag{5.42}
$$

This bound is not ideal since it depends on the number of neurons \\(m\\). Empirically, it has been found that more neurons actually improves generalization error.

*Proof.*

$$
\begin{aligned}
R_S(\mathcal{H}) &= \mathbb{E}_\sigma\left[\sup_\theta \frac1n\sum_{i=1}^n \sigma_i\langle w,\phi(Ux^{(i)})\rangle\right] && (5.43)\\
&= \frac1n\mathbb{E}_\sigma\left[\sup_{U:\lVert u_j\rVert_2\le B_u}\ \sup_{\lVert w\rVert_2\le B_w}\Big\langle w,\sum_{i=1}^n \sigma_i\phi(Ux^{(i)})\Big\rangle\right] && (5.44)\\
&= \frac{B_w}{n}\mathbb{E}_\sigma\left[\sup_{U:\lVert u_j\rVert_2\le B_u}\Big\lVert\sum_{i=1}^n \sigma_i\phi(Ux^{(i)})\Big\rVert_2\right] && (5.45)\\
&\le \frac{B_w\sqrt m}{n}\mathbb{E}_\sigma\left[\sup_{U:\lVert u_j\rVert_2\le B_u}\Big\lVert\sum_{i=1}^n \sigma_i\phi(Ux^{(i)})\Big\rVert_\infty\right] && (5.46)\\
&= \frac{B_w\sqrt m}{n}\mathbb{E}_\sigma\left[\sup_{U:\lVert u_j\rVert_2\le B_u}\ \max_{1\le j\le m}\Big\lvert\sum_{i=1}^n \sigma_i\phi(u_j^\top x^{(i)})\Big\rvert\right] && (5.47)\\
&= \frac{B_w\sqrt m}{n}\mathbb{E}_\sigma\left[\sup_{\lVert u\rVert_2\le B_u}\Big\lvert\sum_{i=1}^n \sigma_i\phi(u^\top x^{(i)})\Big\rvert\right] && (5.48)\\
&\le \frac{2B_w\sqrt m}{n}\mathbb{E}_\sigma\left[\sup_{\lVert u\rVert_2\le B_u}\sum_{i=1}^n \sigma_i\phi(u^\top x^{(i)})\right] && (5.49)\\
&\le \frac{2B_w\sqrt m}{n}\mathbb{E}_\sigma\left[\sup_{\lVert u\rVert_2\le B_u}\sum_{i=1}^n \sigma_i u^\top x^{(i)}\right]. && (5.50)
\end{aligned}
$$

Applying Theorem 5.5 to the linear class in (5.50),

$$
R_S(\mathcal{H}) \;\le\; \frac{2B_w\sqrt m}{n}B_u\sqrt{\sum_{i=1}^n\lVert x^{(i)}\rVert_2^2}.
\tag{5.51}
$$

Taking expectations with respect to \\(x\sim P\\) completes the proof:

$$
R_n(\mathcal{H}) = \mathbb{E}[R_S(\mathcal{H})] \le \frac{2B_wB_u\sqrt m}{n}\,C\sqrt n = 2B_wB_uC\sqrt{\frac mn}.
\tag{5.55}
$$

∎

My annotations on the steps:

- (5.43) by definition of \\(R\_S(\mathcal{H})\\).
- (5.44) linearity, plus expanding the sup by each parameter — the joint sup over \\(\theta = (w,U)\\) splits into nested sups because the constraints on \\(w\\) and \\(U\\) are separate.
- (5.45) sup characterization of the \\(\ell\_2\\) norm, as in (5.20).
- (5.46) \\(\ell\_\infty\\) bound of the \\(\ell\_2\\) norm: \\(\lVert v\rVert\_2\le\sqrt m\lVert v\rVert\_\infty\\) for \\(v\in\mathbb{R}^m\\). This is where the \\(\sqrt m\\) enters, and it is the step responsible for the undesirable width dependence.
- (5.47) definition of the \\(\ell\_\infty\\) norm.
- (5.48) each \\(u\_j\\) ranges over the same set, so the max over \\(j\\) collapses into a single sup over \\(\lVert u\rVert\_2\le B\_u\\) — collapse of notation, no loss.
- (5.49) by Lemma 5.12, which removes the absolute value at the cost of a factor of 2.
- (5.50) Talagrand's lemma plus the fact that ReLU is \\(1\\)-Lipschitz. Note (5.49) is the Rademacher complexity of \\(\\{x\mapsto\phi(u^\top x) : \lVert u\rVert\_2\le B\_u\\}\\), which is the family we apply the contraction lemma to; then (5.50) is a Rademacher complexity of bounded-\\(\ell\_2\\)-norm linear models.

### Refined bounds

Theme: functional invariance of two-layer neural networks under a class of rescaling transformations.

*Key:* positive homogeneity of ReLU,

$$
\alpha\phi(x) = \phi(\alpha x) \qquad\forall\alpha>0.
\tag{5.56}
$$

This implies that for any \\(\lambda\_i>0\\), \\(i\in[m]\\), the transformation

$$
\theta = \{(w_i,u_i)\}_{i\in[m]} \;\longmapsto\; \theta' = \{(\lambda_i w_i,\, u_i/\lambda_i)\}_{i\in[m]}
$$

has no net effect on the network's functionality: \\(f\_\theta = f\_{\theta'}\\). So we want a new complexity measure which is invariant under such transformations.

<!-- The following box was a margin annotation in the source; promoted to body
     content per Josh's note: "I like this little group theory language tips and
     tricks thing and definitely want to put in my web post." -->

<details style="border: 1.5px solid currentColor; border-radius: 4px; margin: 1.2em 0; padding: 0;">
<summary style="padding: 0.4em 1.1em; font-weight: 700; cursor: pointer;">What invariance means and why we want it</summary>
<div style="padding: 0.75em 1.1em; border-top: 1.5px solid currentColor;" markdown="1">
Let \\(G = (\mathbb{R}\_{>0})^m\\) act on \\(\Theta\\) by \\(T\_\lambda\theta = \\{(\lambda\_j w\_j,\, u\_j/\lambda\_j)\\}\_j\\). By (5.56), \\(f\_{T\_\lambda\theta} = f\_\theta\\), so \\(\theta\mapsto f\_\theta\\) is constant on \\(G\\)-orbits. A complexity measure \\(C\\) is *invariant* if it is constant on orbits, i.e. descends to the quotient \\(\Theta/G\\).

- \\(R\_S\\) depends on the class only through \\(Q\\), so it is blind to representatives: the class contains \\(f\_\theta\\) as soon as *any* point of \\(\theta\\)'s orbit satisfies the constraint. A constraint set that is not a union of orbits misdescribes its own function class.
- (5.41) is not a union of orbits: with \\(m=2\\), unit weights, \\(\lambda=(t,1)\\), the measure \\(\lVert w\rVert\_2\max\_j\lVert u\_j\rVert\_2\to\infty\\) while \\(f\_\theta\\) is fixed. Minimizing over orbits (\\(\lambda\_j = \lVert u\_j\rVert\_2/B\_u\\)) shows (5.41) really cuts out the \\(\ell\_2\\) ball \\(\sum\_j w\_j^2\lVert u\_j\rVert\_2^2\le B\_w^2B\_u^2\\) in the per-unit invariants \\(\lvert w\_j\rvert\lVert u\_j\rVert\_2\\).
- \\(C(\theta)=\sum\_j \lvert w\_j\rvert\lVert u\_j\rVert\_2\\) is invariant termwise, so (5.58) *is* a union of orbits — the \\(\ell\_1\\) ball in the same invariants. The two classes differ by \\(\lVert v\rVert\_2\le\lVert v\rVert\_1\le\sqrt m\lVert v\rVert\_2\\): the weak bound's \\(\sqrt m\\) is the \\(\ell\_1\\)–\\(\ell\_2\\) gap, a property of the parameterization, not the function.

General principle: **when a bound depends on a quantity the object being bounded cannot see, find the group acting on the parameters and quotient by it.**
</div>
</details>

**Theorem (Ma 5.10).** Let \\(C(\theta) = \sum\_{j=1}^m \lvert w\_j\rvert\lVert u\_j\rVert\_2\\) and for some \\(B>0\\) consider

$$
\mathcal{H} = \{f_\theta : C(\theta)\le B\}.
\tag{5.58}
$$

If \\(\lVert x^{(i)}\rVert\_2\le C\\) for all \\(i\in[n]\\), then

$$
R_S(\mathcal{H}) \;\le\; \frac{2BC}{\sqrt n}.
\tag{5.59}
$$

No dependence on \\(m\\) — except maybe arguably through \\(B\\). So it is possible to use more neurons and still maintain a tight bound if the value of the new complexity measure \\(C(\theta)\\) is reasonable.

- One can show this new theorem is strictly stronger than the weak-bound theorem. By Cauchy–Schwarz,

  $$
  \sum_j \lvert w_j\rvert\lVert u_j\rVert_2 \le \Big(\sum_j\lvert w_j\rvert^2\Big)^{1/2}\Big(\sum_j\lVert u_j\rVert_2^2\Big)^{1/2} \le \lVert w\rVert_2\cdot\sqrt m\cdot\max_j\lVert u_j\rVert_2,
  \tag{5.60}
  $$

  so with \\(\mathcal{H}\_1 = \\{f\_\theta : \sum\lvert w\_j\rvert\lVert u\_j\rVert\_2\le B'\\}\\) and \\(\mathcal{H}\_2 = \\{f\_\theta : \lVert w\rVert\_2\sqrt m\max\_j\lVert u\_j\rVert\_2\le B'\\}\\), both theorems give \\(O(B'/\sqrt n)\\) but \\(\mathcal{H}\_1\supset\mathcal{H}\_2\\).
- One can also get a generalization guarantee which decreases as \\(m\\) increases.

*Proof of Theorem 5.10.* Put \\(\bar u\_j = u\_j/\lVert u\_j\rVert\_2\\), so that \\(\phi(u\_j^\top x) = \lVert u\_j\rVert\_2\,\phi(\bar u\_j^\top x)\\). Then

$$
\begin{aligned}
R_S(\mathcal{H}) &= \frac1n\mathbb{E}_\sigma\left[\sup_\theta\sum_{i=1}^n \sigma_i f_\theta(x^{(i)})\right] && (5.61)\\
&= \frac1n\mathbb{E}_\sigma\left[\sup_\theta\sum_{i=1}^n \sigma_i\sum_{j=1}^m w_j\phi(u_j^\top x^{(i)})\right] && (5.62)\\
&= \frac1n\mathbb{E}_\sigma\left[\sup_\theta\sum_{i=1}^n \sigma_i\sum_{j=1}^m w_j\lVert u_j\rVert_2\,\phi(\bar u_j^\top x^{(i)})\right] && (5.63)\\
&= \frac1n\mathbb{E}_\sigma\left[\sup_\theta\sum_{j=1}^m w_j\lVert u_j\rVert_2\left(\sum_{i=1}^n \sigma_i\phi(\bar u_j^\top x^{(i)})\right)\right] && (5.64)\\
&\le \frac1n\mathbb{E}_\sigma\left[\sup_\theta\sum_{j=1}^m \lvert w_j\rvert\lVert u_j\rVert_2\ \max_{k\in[n]}\Big\lvert\sum_{i=1}^n \sigma_i\phi(\bar u_k^\top x^{(i)})\Big\rvert\right] && (5.65)\\
&\le \frac{B}{n}\mathbb{E}_\sigma\left[\sup_{\theta}\ \max_{k}\Big\lvert\sum_{i=1}^n \sigma_i\phi(\bar u_k^\top x^{(i)})\Big\rvert\right] && (5.66)\\
&= \frac{B}{n}\mathbb{E}_\sigma\left[\sup_{\bar u:\lVert \bar u\rVert_2 = 1}\Big\lvert\sum_{i=1}^n \sigma_i\phi(\bar u^\top x^{(i)})\Big\rvert\right] && (5.67)\\
&\le \frac{B}{n}\mathbb{E}_\sigma\left[\sup_{\bar u:\lVert \bar u\rVert_2\le 1}\Big\lvert\sum_{i=1}^n \sigma_i\phi(\bar u^\top x^{(i)})\Big\rvert\right] && (5.68)\\
&\le \frac{2B}{n}\mathbb{E}_\sigma\left[\sup_{\bar u:\lVert \bar u\rVert_2\le 1}\sum_{i=1}^n \sigma_i\phi(\bar u^\top x^{(i)})\right] && (5.69)\\
&= 2B\,R_S(\mathcal{H}'), && (5.70)
\end{aligned}
$$

where \\(\mathcal{H}' = \\{x\mapsto\phi(\bar u^\top x) : \bar u\in\mathbb{R}^d,\ \lVert\bar u\rVert\_2\le1\\}\\). By Talagrand's lemma and \\(\phi\\) being \\(1\\)-Lipschitz, \\(R\_S(\mathcal{H}')\le R\_S(\mathcal{H}'')\\) where \\(\mathcal{H}'' = \\{x\mapsto\bar u^\top x : \lVert\bar u\rVert\_2\le 1\\}\\) is a linear hypothesis space. Then \\(R\_S(\mathcal{H}'')\le C/\sqrt n\\) by the previous theorem, which concludes the proof. ∎

My annotations on the steps:

- (5.61) by definition of \\(R\_S(\mathcal{H})\\), plus linearity.
- (5.62) by definition of \\(f\_\theta\\).
- (5.63) positive homogeneity of \\(\phi\\).
- (5.64) linearity (swap the order of the two sums).
- (5.65) since \\(\sum\_j\alpha\_j\beta\_j \le \sum\_j\lvert\alpha\_j\rvert\max\_k\lvert\beta\_k\rvert\\).
- (5.66) since \\(C(\theta) = \sum\_j\lvert w\_j\rvert\lVert u\_j\rVert\_2 \le B\\).
- (5.67) since \\(w\\) is gone and \\(\bar u\\) is isolated — the sup over \\(\theta\\) and \\(\max\_k\\) together are just a sup over unit vectors.
- (5.68) sup over a larger set.
- (5.69) Lemma 5.12.
- (5.70) definition of \\(R\_S(\mathcal{H}')\\).

**Lemma (Ma 5.12).** Let \\(\sigma = (\sigma\_1,\dots,\sigma\_n)\\) and \\(f\_\theta(x) = (f\_\theta(x^{(1)}),\dots,f\_\theta(x^{(n)}))\\). Suppose that for any \\(\sigma\in\\{\pm1\\}^n\\) we have \\(\sup\_\theta\langle\sigma,f\_\theta(x)\rangle\ge 0\\). Then

$$
\mathbb{E}_\sigma\left[\sup_\theta\big\lvert\langle\sigma,f_\theta(x)\rangle\big\rvert\right]
\;\le\; 2\,\mathbb{E}_\sigma\left[\sup_\theta\langle\sigma,f_\theta(x)\rangle\right].
\tag{5.72}
$$

*Proof.* The assumption implies \\(\sup\_\theta\phi(\langle\sigma,f\_\theta(x)\rangle) = \sup\_\theta\langle\sigma,f\_\theta(x)\rangle\\) for any \\(\sigma\\). Using \\(\lvert z\rvert = \phi(z) + \phi(-z)\\),

$$
\begin{aligned}
\sup_\theta\lvert\langle\sigma,f_\theta(x)\rangle\rvert &= \sup_\theta\big[\phi(\langle\sigma,f_\theta(x)\rangle) + \phi(\langle-\sigma,f_\theta(x)\rangle)\big] && (5.73)\\
&\le \sup_\theta\phi(\langle\sigma,f_\theta(x)\rangle) + \sup_\theta\phi(\langle-\sigma,f_\theta(x)\rangle) && (5.74)\\
&= \sup_\theta\langle\sigma,f_\theta(x)\rangle + \sup_\theta\langle-\sigma,f_\theta(x)\rangle. && (5.75)
\end{aligned}
$$

Take expectations over \\(\sigma\\) and use \\(\sigma \overset{d}{=} -\sigma\\). ∎

> 📌 I looked for this in the 210B notes and did not find it — it is specific to Ma, and the proof above is his. The hypothesis \\(\sup\_\theta\langle\sigma,f\_\theta(x)\rangle\ge0\\) does hold in both places we use it, since \\(\bar u = 0\\) (resp. \\(u = 0\\)) is admissible and gives \\(0\\). The nearest 210B relative is the two-sided [maximal inequality, Remark 2.41(2)]({{ site.baseurl }}/machine-learning-almanac/stat210b/maximal-inequality), which is the same "pay a factor of 2 to handle absolute values" move.

## More implications of the refined bound

Recall margin theory gave the bound: for all \\(\theta\\), with probability \\(\ge1-\delta\\),

$$
L_{0\text{-}1}(\theta) \;\le\; \frac{2R_S(\mathcal{H})}{\gamma_{\min}} + \widetilde O\!\left(\sqrt{\frac{\log(2/\delta)}{n}}\right).
\tag{5.76}
$$

So Theorem 5.10 motivates us to minimize \\(R\_S(\mathcal{H})/\gamma\_{\min}\\) by regularizing \\(C(\theta)\\). We have two possible formulations as optimization problems:

$$
\begin{aligned}
\text{(I)}\qquad &\text{minimize}\quad C(\theta) = \sum_{j=1}^m\lvert w_j\rvert\lVert u_j\rVert_2
\quad\text{subject to}\quad \gamma_{\min}(\theta)\ge1,\\
\text{(II)}\qquad &\text{maximize}\quad \gamma_{\min}(\theta)
\quad\text{subject to}\quad C(\theta)\le 1.
\end{aligned}
$$

One can show the optimal network in (I) is functionally equivalent to the new problem

$$
\text{(I}^\star\text{)}\qquad \text{minimize}\quad
C_{\ell_2}(\theta) \triangleq \frac12\sum_{j=1}^m\lvert w_j\rvert^2 + \frac12\sum_{j=1}^m\lVert u_j\rVert_2^2
\quad\text{subject to}\quad \gamma_{\min}\ge1,
$$

because of the positive homogeneity of \\(\phi\\).

> 📌 The mechanism, in one line, since it is the invariance discussion cashed out. By AM–GM, \\(\lvert w\_j\rvert\lVert u\_j\rVert\_2 \le \frac12\big(\lvert w\_j\rvert^2 + \lVert u\_j\rVert\_2^2\big)\\) with equality iff \\(\lvert w\_j\rvert = \lVert u\_j\rVert\_2\\), so \\(C(\theta)\le C\_{\ell\_2}(\theta)\\) always. But the rescaling \\(T\_\lambda\\) lets us *enforce* \\(\lvert w\_j\rvert = \lVert u\_j\rVert\_2\\) for every \\(j\\) without changing \\(f\_\theta\\) or \\(\gamma\_{\min}\\) — take \\(\lambda\_j = \sqrt{\lVert u\_j\rVert\_2/\lvert w\_j\rvert}\\). Minimizing over each orbit therefore makes the two objectives agree, and the constraint \\(\gamma\_{\min}\ge1\\) is itself orbit-invariant. So the two programs have the same optimal value and the same optimal functions. This is what lets you replace an unfamiliar homogeneous penalty by the ordinary weight decay everyone actually runs.

> ✏️ **Josh (TODO):** Section 5.4.3 (equivalence to an \\(\ell\_1\\)-SVM in the \\(m\to\infty\\) limit) is super interesting and deserves its own post.

## Deep neural nets (via covering numbers)

First, a covering number bound for linear models.

**Theorem (Zhang, 2002; Ma 5.16).** Suppose \\(x^{(1)},\dots,x^{(n)}\in\mathbb{R}^d\\) are \\(n\\) data points and \\(p,q\\) satisfy \\(\frac1p+\frac1q = 1\\) with \\(2\le p\le\infty\\). Assume \\(\lVert x^{(i)}\rVert\_p\le C\\) for all \\(i\\). Let \\(\mathcal{F}\_q = \\{x\mapsto\langle x,w\rangle : \lVert w\rVert\_q\le B\\}\\) and let \\(\rho = L\_2(P\_n)\\). Then

$$
\log N(\epsilon,\mathcal{F}_q,\rho) \;\le\; \left\lceil\frac{B^2C^2}{\epsilon^2}\right\rceil\log_2(2d+1).
\tag{5.93}
$$

When \\(p = q = 2\\) we get

$$
\log N(\epsilon,\mathcal{F}_2,\rho) \;\le\; \left\lceil\frac{B^2C^2}{\epsilon^2}\right\rceil\log_2\big(2\min(n,d)+1\big).
\tag{5.94}
$$

Note that applying localized Dudley to the covering number bound above with \\(R = B^2C^2\\), we conclude

$$
R_S(\mathcal{F}_2) \;\le\; \widetilde O\!\left(\frac{BC}{\sqrt n}\right).
\tag{5.95}
$$

Theorem 5.5 proves this without relying on Dudley.

> 📌 Found it. STAT 210B §9.7, **[Proposition 9.19 (Dudley's entropy integral, localized form)]({{ site.baseurl }}/machine-learning-almanac/stat210b/localized-dudley)**: with the localization \\(T\_n(\delta) = \\{g\in\mathcal{F} : \lVert g\rVert\_n\le\delta\\}\\), the localized Gaussian complexity satisfies
>
> $$
> G_n(\delta;\mathcal{F}) \;\le\; \frac{C}{\sqrt n}\int_0^\delta \sqrt{\log N\big(T_n(\delta),\ \lVert\cdot\rVert_n,\ \epsilon\big)}\,d\epsilon .
> $$
>
> The proof there is the one to cite: the increments \\(X\_g = \frac1n\sum\_i w\_i g(X\_i)\\) form a Gaussian process whose canonical metric is \\(\frac{1}{\sqrt n}\lVert\cdot\rVert\_n\\), star-shapedness gives \\(0\in T\_n(\delta)\\), and \\(\operatorname{diam} \le 2\delta/\sqrt n\\) caps the integral. The rougher first pass is at §9.6, Prop. 9.16 ("he erased the rest of the proof immediately after writing it"). Downstream: Cor. 9.21 is the critical-radius fixed point, Thm. 9.23 converts polynomial entropy \\(\log N \le A\epsilon^{-p}\\) into the rate \\(\delta\_n \asymp (\sigma^2/n)^{1/(p+2)}\\), and Remark 9.20 gives the chaining intuition.
>
> Worth pairing with 210B Remark 9.25: the Dudley integral \\(\int\_0^\delta \epsilon^{-p/2}d\epsilon\\) converges *iff* \\(p<2\\). Ma's covering bound here is \\(\log N \le R/\epsilon^2\\), i.e. exactly \\(p = 2\\), the borderline case — which is why Ma calls it "the worst dependency on \\(\epsilon\\) that we can tolerate," and why (5.95) is stated with a \\(\widetilde O\\) rather than an \\(O\\): the log factor hidden in the tilde is precisely the logarithmic divergence at the \\(p=2\\) endpoint. The localization is what makes the borderline usable.

**Theorem (Ma 5.18).** *Notation:* let \\(M = (M\_1,\dots,M\_n)\in\mathbb{R}^{m\times n}\\) and \\(\lVert M\rVert\_{2,1} = \sum\_{i=1}^n\lVert M\_i\rVert\_2\\); then \\(\lVert M^\top\rVert\_{2,1}\\) is the sum of the \\(\ell\_2\\) norms of the rows of \\(M\\).

Let \\(\mathcal{F} = \\{x\mapsto Wx : W\in\mathbb{R}^{m\times d},\ \lVert W^\top\rVert\_{2,1}\le B\\}\\) and let \\(c = \sqrt{\frac1n\sum\_{i=1}^n\lVert x^{(i)}\rVert\_2^2}\\). Then

$$
\log N\big(\epsilon,\mathcal{F},L_2(P_n)\big) \;\le\; \frac{c^2B^2}{\epsilon^2}\ln(2dm).
\tag{5.96}
$$

**Remark.** This result arises from treating each dimension of the multivariate problem independently. If \\(W\\) has rows \\(w\_1^\top,\dots,w\_m^\top\\) then \\(Wx = (w\_1^\top x,\dots,w\_m^\top x)^\top\\), and \\(\lVert W^\top\rVert\_{2,1} = \sum\_i\lVert w\_i\rVert\_2\\).

### Deep neural nets

*Notation.* \\(W\_i\\) is the linear weight matrix at the \\(i\\)th layer of the network, we have \\(r\\) layers, and \\(\sigma\\) is the activation function, which is \\(1\\)-Lipschitz (e.g. ReLU, softmax, or sigmoid):

$$
f_\theta:\ x \longmapsto W_r\sigma\big(W_{r-1}\sigma(\cdots\sigma(W_1x)\cdots)\big).
\tag{5.97}
$$

**Theorem (Bartlett et al., 2017; Ma 5.20).** Suppose \\(\lVert x^{(i)}\rVert\_2\le c\\) for all \\(i\\) and let \\(\mathcal{F} = \\{f\_\theta : \lVert W\_i\rVert\_{\mathrm{op}}\le\kappa\_i,\ \lVert W\_i^\top\rVert\_{2,1}\le b\_i\\}\\). Then

$$
R_S(\mathcal{F}) \;\le\; \frac{c}{\sqrt n}\cdot
\underbrace{\left(\prod_{i=1}^r \kappa_i\right)}_{(\mathrm{I})}\cdot
\underbrace{\left(\sum_{i=1}^r \frac{b_i^{2/3}}{\kappa_i^{2/3}}\right)^{3/2}}_{(\mathrm{II})}.
\tag{5.99}
$$

(I), a product of matrix norms, dominates the bound since (II) is more of a sum of matrix norms.

> 📌 It does not dominate automatically, and the "product beats sum" slogan is about how the two scale with *depth*, not about products beating sums in general. Set all \\(\kappa\_i = \kappa\\) and \\(b\_i = b\\). Then
>
> $$
> (\mathrm{I}) = \kappa^r,\qquad
> (\mathrm{II}) = \left(r\,\frac{b^{2/3}}{\kappa^{2/3}}\right)^{3/2} = r^{3/2}\,\frac{b}{\kappa},
> \qquad (\mathrm{I})\cdot(\mathrm{II}) = r^{3/2}\,b\,\kappa^{r-1}.
> $$
>
> So (II) grows polynomially in depth, \\(r^{3/2}\\), while (I) grows *geometrically*, \\(\kappa^r\\). For any \\(\kappa > 1\\) — and trained networks have layer operator norms comfortably above \\(1\\) — the product swamps the sum once \\(r\\) is moderate. (If \\(\kappa<1\\) the product decays and the whole bound is small anyway, so the interesting regime is the one where (I) dominates.)
>
> The reason this matters rather than being a curiosity: (I) is precisely an upper bound on the Lipschitz constant of the whole network, \\(\prod\_i\lVert W\_i\rVert\_{\mathrm{op}}\\), and that product is the known weakness of the Bartlett et al. bound — it is typically astronomically larger than any quantity you would measure on a trained net. Ma's Chapter 6 (all-layer margin) is built to remove exactly this factor; his Remark 6.8 shows the all-layer margin bound is strictly better because \\(\frac{1}{m\_f(x,y)} \lesssim \frac{1}{yf(x)}\prod\_i\lVert W\_i\rVert\_{\mathrm{op}}\\), i.e. the new bound is at worst the old one and generally much smaller.

*Rf.* Recall \\(f(x) = Wx\\) is \\(\lVert W\rVert\_{\mathrm{op}}\\)-Lipschitz, since \\(\lVert Wx - Wy\rVert\_2 \le \lVert W\rVert\_{\mathrm{op}}\lVert x-y\rVert\_2\\).

**Corollary.**

$$
\text{generalization loss} \;\le\; \widetilde O\!\left(
\frac{1}{\gamma_{\min}}\cdot\frac{1}{\sqrt n}\cdot
\left(\prod_{i=1}^r \lVert W_i\rVert_{\mathrm{op}}\right)
\left(\sum_{i=1}^r \frac{\lVert W_i^\top\rVert_{2,1}^{2/3}}{\lVert W_i\rVert_{\mathrm{op}}^{2/3}}\right)^{3/2}\right).
\tag{5.102}
$$

*Proof, main ideas.*

1. High level: show the covering number \\(N(\epsilon,\mathcal{F},\rho)\\) for a dense neural network is \\(\le R/\epsilon^2\\). Then we could use localized Dudley to get a Rademacher complexity bound.
2. To bound the covering number for a dense NN, we \\(\epsilon\\)-cover each layer separately and then combine to cover the original function \\(f\_\theta\\).
3. Combining covers of each layer uses Lipschitzness.
4. Control and approximate the error propagation that is introduced by using an \\(\epsilon\\)-cover of each layer, to get a reasonable final \\(\epsilon\\).

*Proof prelude:* lots of covering and Lipschitz details. Maybe just give a quick summary of each step above.

> 📌 One concrete detail worth keeping if I do write it up: abstract each layer as \\(\mathcal{F}\_i\\) (multiplication by \\(W\_i\\) then \\(\sigma\\)), so \\(\mathcal{F} = \mathcal{F}\_r\circ\cdots\circ\mathcal{F}\_1\\). Assuming \\(f\_i\\) is \\(\kappa\_i\\)-Lipschitz with \\(f\_i(0)=0\\) and \\(\lVert x^{(j)}\rVert\_2\le c\\), the outputs at depth \\(i\\) satisfy \\(\lVert f\_i(\cdots f\_1(x^{(j)}))\rVert\_2 \le \kappa\_i\kappa\_{i-1}\cdots\kappa\_1 c \triangleq c\_i\\), which is (5.105) and is exactly the quantity that propagates the covering error forward. Note \\(c\_r\\) is (I) again, times \\(c\\) — the product of operator norms is not an artifact of the proof technique, it is the size of the network's output. The \\(2/3\\) exponents in (II) come out of optimizing how much \\(\epsilon\\)-budget to spend on each layer.
