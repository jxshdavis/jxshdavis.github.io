---
title: "Learning as Optimization: the Excess Risk Decomposition"
date: 2026-08-27
modified: 2026-08-29
permalink: /machine-learning-almanac/stat241a/learning-as-optimization
tags:
  - Learning Theory
  - STAT 241A
  - Optimization
excerpt: "Why 'learning is optimization': no free lunch, the three-term excess risk decomposition, and the coupling that makes deep learning theory interesting."
toc: false  # the theme's toc.html include is missing; enable if that gets fixed
author_profile: false
sidebar:
  title: "ML Almanac"
  nav: sidebar-almanac
---

<!--
  Synthesized from STAT 241A lecture, August 27th (Jason Lee).
  Annotation key:
    ✏️ Josh    — Josh's own margin notes / open questions, to resolve while polishing.
    🤖 Claude  — Claude's annotations: draft answers, suggestions, and flags. Delete or absorb freely.
-->

*These are synthesized notes from lecture 1 of STAT 241A (Theoretical Statistics, Jason Lee), August 27th.* A lot of the introduction content is largely based on *Learning Theory from First Principles* by Francis Bach, chapter 5.


## Learning and Optimization

**Definition (Learning problem).** A *learning problem* is a triple \\((\mathcal{Z}, \Theta, \ell)\\) — instance space \\(\mathcal{Z} = \mathcal{X}\times\mathcal{Y}\\), model class \\(\Theta\\), and loss \\(\ell\\). We are also given a family \\(\mathcal{P}\\) of distributions on \\(\mathcal{Z}\\) that we are willing to assume the data came from.

> ✏️ **Josh:** What exactly does "willing to assume" mean? What are the implications of this precise word choice yet cloudy framing? I'd like some human opinions on this found in statistics or machine learning materials this course is based on.
>
> 🤖 **Claude (draft answer, verify against sources):** The phrase encodes that \\(\mathcal{P}\\) is a *modeling choice*, not a fact about the world — and the no-free-lunch theorem below is exactly the payoff of that choice: with \\(\mathcal{P}\\) = all distributions, learning is impossible, so *someone must choose* to shrink \\(\mathcal{P}\\), and every guarantee in the course is conditional on that choice being right. Places to look for "human opinions": Bach §1.1 and the discussion around his NFL statement; Shalev-Shwartz & Ben-David (*Understanding Machine Learning*) frame the same thing as "prior knowledge" and the bias–complexity tradeoff (ch. 5); Vapnik's *Nature of Statistical Learning Theory* is the classic "don't assume more than you need" position. Note also that \\(\mathcal{P}\\) restricting *distributions* is a different (weaker) commitment than \\(\Theta\\) being well-specified — you can believe \\(P \in \mathcal{P}\\) while knowing no \\(\theta \in \Theta\\) matches \\(P\\).

We observe

$$
S = (z_1,\dots,z_n) \sim P^n
\qquad\text{for unknown } P\in\mathcal{P}.
$$

A *learning algorithm* is a map \\(\mathcal{A}:\bigcup\_n \mathcal{Z}^n \to \Theta\\). It *learns at rate* \\(\varepsilon\_n(\delta)\\) if, for all \\(P\in\mathcal{P}\\),

$$
\underbrace{L_P(\mathcal{A}(S))}_{\substack{\text{population loss of the}\\ \text{predicted parameter value}}}
\;-\; \inf_{\theta\in\Theta} L_P(\theta) \;\le\; \varepsilon_n(\delta)
$$

with probability at least \\(1-\delta\\) over \\(S\sim P^n\\), and with \\(\varepsilon\_n(\delta)\to 0\\).

<div style="border: 1.5px solid currentColor; border-radius: 4px; padding: 0.75em 1em; margin: 1.2em 0;">
Note how the unknown nature of \(P\in\mathcal{P}\) separates learning from optimization.
</div>

> ✏️ **Josh:** Does this really define a distinction between learning and optimization? Why?
>
> 🤖 **Claude (draft answer):** One way to make it precise: an optimization problem hands you the objective; a learning problem hands you \\(n\\) noisy *evaluations* of the objective (through samples) and asks you to do well on the objective you never see. Formally, learning = optimization of \\(L\_P\\) when \\(P\\) (hence \\(L\_P\\)) is only accessible through \\(S\\). Every hardness in learning that isn't already a hardness in optimization enters through that gap — which is exactly why the decomposition below isolates the "gap" terms (1) and (3) from the "pure optimization" term (2).

**Example (Multiple linear regression as a learning problem).** Take \\(\Theta = \mathbb{R}^d\\) and the squared loss \\(\ell = \big(y\_i - f\_i(\theta)\big)^2\\), with the OLS algorithm

$$
\mathcal{A}(S) = \hat\theta = (X^\top X)^{-1}X^\top Y.
$$

- \\(\mathcal{X}\times\mathcal{Y} = \mathbb{R}^d\times\mathbb{R}\\), so \\(z = \big((x\_1,\dots,x\_d),\,y\big)\\).
- \\(S = (X,Y)\\), the \\(n\times d\\) design matrix and the response vector.
- \\(L\_n(\theta) = \frac1n\lVert Y - X\theta\rVert\_2^2\\), the training MSE.
- \\(L\_P(\theta) = \mathbb{E}\_{(x,y)\sim P}\big(y - x^\top\theta\big)^2\\), the test MSE.
- \\(\theta^\star = \Sigma^{-1}\mathbb{E}(xy)\\), where \\(\Sigma = \mathbb{E}(xx^\top)\\).
- Excess risk: \\(L\_P(\theta) - L\_P(\theta^\star) = \lVert\theta-\theta^\star\rVert\_\Sigma^2\\).



## No Free Lunch

**Theorem (No free lunch, Bach).** Consider binary classification with \\(0/1\\) loss and \\(\mathcal{X}\\) infinite. Let \\(\mathcal{P}\\) denote the set of all probability distributions on \\(\mathcal{X}\times\\{0,1\\}\\). For any \\(n > 0\\) and any learning algorithm \\(\mathcal{A}\\),

$$
\sup_{P\in\mathcal{P}}\ \left\{\, \mathbb{E}\left[ R_P\big(\mathcal{A}(D_n(P))\big)\right] - R_P^\star \,\right\}
\;\ge\; \frac12 .
$$


>
> 📌 (notation breakdown):
> - \\(D\_n(P)\\): a training set of \\(n\\) i.i.d. samples drawn from \\(P\\).
> - \\(\mathcal{A}(D\_n(P))\\): the classifier your algorithm produces after seeing that training set.
> - \\(R\_P(\cdot)\\): the probability that classifier misclassifies a *fresh* point from \\(P\\) (test error).
> - \\(\mathbb{E}[\cdots]\\): averaged over the randomness of which training set you were dealt.
> - \\(R\_P^\star\\): the test error of the best possible classifier for \\(P\\) — the Bayes error.
> - \\(\sup\_{P\in\mathcal{P}}\\): now let an adversary pick the worst distribution for your algorithm, *after* seeing your algorithm.
>
> In English: *no matter what algorithm you commit to, and no matter how much data \\(n\\) you get, there is some data distribution on which your expected test error exceeds the best achievable error by at least \\(1/2\\)* — i.e. you do no better than random guessing on that distribution.

How to interpret the main result: we cannot find any learning algorithm that works optimally for all distributions — we must restrict the distribution family to learn. 

The goal of learning is to choose the learning algorithm so that the excess risk is small with high probability. We frame learning problems as \\(\min\_\theta L\_n(\theta)\\) so that they look like optimization problems.

## Machine Learning Framing of a Learning Problem

The machine learning framing of a learning problem has two ingredients: a *model*, which maps parameters to predictions, and a *loss*, which scores those predictions against the data.

**1. The model.** A model (also called a *learning machine* or an *architecture*) is a parameterized family of prediction functions \\(f(\,\cdot\,;\theta)\\). We abbreviate the prediction on the \\(i\\)-th data point as

$$
f_i(\theta) = f(x_i;\theta).
$$

Two running examples:

- **Linear model:** \\(f\_i(\theta) = x\_i^\top\theta\\), with \\(\theta\in\mathbb{R}^d\\).
- **Neural net:** \\(f\_i(\theta) = W\_L\,\sigma\big(W\_{L-1}\,\sigma(\cdots\sigma(W\_1 x\_i)\cdots)\big)\\), with \\(\theta = (W\_1,\dots,W\_L)\\).

**2. The loss function.** A loss \\(\ell(y,\hat y)\\) scores a prediction \\(\hat y = f\_i(\theta)\\) against the observed \\(y\\). (For the classification losses below, labels are \\(y\in\\{-1,+1\\}\\).) The standard examples, and where each shows up:

- **Squared loss** — regression:

  $$
  \ell(y,\hat y) = (y-\hat y)^2.
  $$

- **Logistic loss** ("cross entropy") — binary classification:

  $$
  \ell(y,\hat y) = \log\big(1 + e^{-y\hat y}\big).
  $$

- **Hinge loss** — SVMs:

  $$
  \ell(y,\hat y) = (1-y\hat y)_+.
  $$

  This one was more relevant five years ago, in the SVM era: an SVM can be framed as the optimization problem "hinge loss \\(+\\) quadratic penalty." (The margin theory motivating that objective is in my [notes on Ma Chapter 5]({{ site.baseurl }}/machine-learning-almanac/stat241a/rademacher-complexity-bounds).)

  > ✏️ **Josh:** Here would be a good place to link to a brief article discussing the connection between the idea SVMs are meant to capture and how we turn it into a convex optimization problem. This would be considered background for this course so it's best not included in this post. Also, why did SVMs fall out of fashion?
  >
  > 🤖 **Claude (draft answer to the second question):** Three usual suspects: (i) kernel methods scale as \\(O(n^2)\\)–\\(O(n^3)\\) in the number of samples, which broke down when datasets hit millions of points; (ii) deep nets learn the representation *and* the classifier jointly, while an SVM's power is capped by a fixed kernel; (iii) empirically, once features are learned, the choice of final-layer classifier barely matters. Standard link candidates for background: Bishop PRML ch. 7, or ESL §12. Note the margin idea didn't die — it reappears in this course as *implicit bias* (GD on logistic loss converges to the max-margin direction).

- **Exponential loss** — AdaBoost:

  $$
  \ell(y,\hat y) = \exp(-y\hat y).
  $$

  > ✏️ **Josh:** Same deal with AdaBoost. It is background. Also, why did AdaBoost fall out of fashion?
  >
  > 🤖 **Claude:** Short version: gradient boosting (XGBoost/LightGBM) generalized it with more flexible losses and regularization, and the exponential loss is badly non-robust to label noise. As background links: Freund–Schapire's original paper, or ESL ch. 10.

  There is a cool anecdote from Schapire et al. (1998) who observed testing error continued to decrease after training error hit zero. This is super funky from a classical perspective. Claude says "That is the interpolation puzzle, twenty years early, in a model nobody would call overparameterized." Margin theory's resolution of this puzzle is worked out in my [notes on Ma Chapter 5]({{ site.baseurl }}/machine-learning-almanac/stat241a/rademacher-complexity-bounds).

  > 🤖 **Claude:** Reference for the anecdote, if you want the citation formal: Schapire, Freund, Bartlett & Lee (1998), "Boosting the margin: a new explanation for the effectiveness of voting methods," *Annals of Statistics*. Their proposed resolution — margins keep improving after training error hits zero — is also a nice foreshadow of the implicit-bias theme later in the course.

## Learning

Goal of learning is not to minimize the empirical loss, but control the excess risk.

For a model \\(f\\), define the population loss as

$$
L(\theta)=\mathbb{E}_{(x,y)\sim P}\ \ell(y, f(x;\theta))
$$

and the empirical loss as

$$
L_n(\theta)=\frac{1}{n}\sum_{i=1}^n \ell(y_i, f(x_i;\theta)).
$$

It is easy to check that

$$
\mathbb{E}[L_n(\theta)]=L(\theta).
$$

Define the excess risk as

$$
L(\theta)- \min_\theta L(\theta).
$$

Note that we overly assume the infimum of \\(L\\) over all possible \\(\theta\\) is attained at some \\(\theta^\star\\) (some ground truth — think of it as the best model fit, not actually what generated the data). For intuition's sake, this assumption helps make things clean. Our goal is to make the excess risk \\(L(\theta)-L(\theta^\star)\\) small.

> ✏️ **Josh:** What is the point of working with excess risk instead of just risk here if excess risk is just risk minus a constant? Well here are my ideas. First, risk cannot always go to zero but excess risk can. This creates a known anchor point (0) for our optimization goals. Second, I think that this form allows the nice 3-term decomposition we see below.
>
> 🤖 **Claude:** Both of your reasons are right, and they compose into a third: because excess risk can hit 0 for *every* \\(P \in \mathcal{P}\\), it's the only version of the objective for which a uniform-over-\\(\mathcal{P}\\) rate \\(\varepsilon\_n(\delta) \to 0\\) is even possible to ask for — a uniform bound on raw risk would be blocked by whatever irreducible Bayes error the worst \\(P\\) has. So the subtraction is exactly what makes the "learns at rate" definition from the first section non-vacuous, and NFL is the statement that even this fails without restricting \\(\mathcal{P}\\).

You could call the next result the fundamental theorem of machine learning.

Let \\(\theta\_t\\) be the result of GD for \\(t\\) steps. We want to bound

$$
L(\theta_t)-L(\theta^\star).
$$

There is a nice decomposition of our excess risk:

$$
\begin{aligned}
  L(\theta_t)-L(\theta^\star)&=\overbrace{L(\theta_t)-L_n(\theta_t)}^{(1)}\\
  &+\overbrace{L_n(\theta_t)-L_n(\theta^\star)}^{(2)}\\
  &+\overbrace{L_n(\theta^\star)-L(\theta^\star)}^{(3)}
\end{aligned}
$$

This decomposition gives us three interpretable terms to tackle bounding instead of the raw expression for excess risk, which by itself can be difficult to analyze.

**Main take away: the three terms need three *different* tools — (1) needs empirical process theory, (2) needs optimization, and (3) needs a single scalar concentration inequality.** Crucial punchline: terms (1) and (2) stop being independent later in the course.

**Term (1)** is bounded by the uniform generalization error \\(\sup\_\theta \lvert L(\theta)-L\_n(\theta)\rvert\\), and there are many tools to bound this. The workhorse is Rademacher complexity — my [notes on Ma Chapter 5]({{ site.baseurl }}/machine-learning-almanac/stat241a/rademacher-complexity-bounds) carry this out concretely for linear models and two-layer neural nets.

> ✏️ **Josh:** If there are one or two nice examples from STAT 210B, maybe we could recall those?
>
> 🤖 **Claude:** Natural candidates from a 210B syllabus: (i) symmetrization + Rademacher complexity, giving \\(\mathbb{E}\sup\_\theta \lvert L\_n - L\rvert \le 2\,\mathcal{R}\_n(\ell \circ \mathcal{F})\\); (ii) finite class / VC dimension via a union bound over Hoeffding, giving the \\(\sqrt{d \log n / n}\\) shape. Either would land well here since term (3) below already uses the 210B Bernstein. *(Also flagging: the source notes had a dangling sentence fragment here — "is bounded by ." — which I removed; check nothing was lost.)*

**Term (2)** is bounded by \\(L\_n(\theta\_t)-\min\_\theta L\_n(\theta) = L\_n(\theta\_t)-L\_n(\theta\_n^\star)\\), where \\(\theta\_n^\star=\arg\min\_{\theta\in\Theta}L\_n(\theta)\\). This is where optimization comes into play.

Note that \\(L\_n(\theta^\star)\ge\min\_\theta L\_n(\theta)\\) since \\(\theta^\star\\) is just some point in \\(\Theta\\).

**Term (3)** is cheap to bound: \\(\theta^\star\\) is deterministic (defined by the population objective), so the difference between the empirical risk and the actual risk at \\(\theta^\star\\) can be controlled nicely:

$$
\mathbb{E}\, L_n(\theta^\star)= \frac{1}{n}\sum_{i=1}^n \mathbb{E}\, \ell(y_i,f_i(\theta^\star)) = L(\theta^\star).
$$

Bernstein's inequality gives, with probability at least \\(1-\delta\\),

$$
\lvert(3)\rvert \leq \sqrt{\frac{2\sigma_\star^2 \log(2/\delta)}{n}}+\frac{2B \log (2/\delta)}{3n},
\qquad \sigma_\star^2 = \mathrm{Var}\big(\ell(y, f(x;\theta^\star))\big),
$$

assuming \\(\lvert\ell\rvert\le B\\) almost surely.

<details>
<summary><strong>Recall: Bernstein's inequality (from STAT 210B)</strong></summary>
<p><em>✏️ Josh's TODO: record the version of Bernstein from my STAT 210B notes here — or just link the toolbox page: <a href="{{ site.baseurl }}/machine-learning-almanac/stat210b/bernstein">Bernstein's Inequality (210B Results Toolbox)</a>.</em></p>
<p>🤖 <em>Claude placeholder (replace with your 210B statement):</em> for independent, mean-zero \(X_1,\dots,X_n\) with \(\lvert X_i\rvert \le B\) a.s. and \(\sum_i \mathbb{E}X_i^2 \le \sigma^2\),</p>
$$
\mathbb{P}\left( \left\lvert \sum_{i=1}^n X_i \right\rvert \ge t \right) \le 2\exp\left( \frac{-t^2/2}{\sigma^2 + Bt/3} \right).
$$
</details>

### How much of this needs a distribution?

> ✏️ **Josh (content for this subsection, currently in note form):** How important is the assumption that data is coming from a distribution? It seems to play a role since our population losses are defined as expectations. In online learning we can drop the distribution assumption entirely: the data is adversarial and the guarantee is regret. Online-to-batch can then be used to convert a regret bound into an excess risk bound when the data happens to be i.i.d.
>
> 🤖 **Claude:** Per your write-up note, this belongs here as a short subsection answering a question readers will have. Your note also says "one-pass SGD is a satisfying punchline" — the punchline being: one-pass SGD *is* online gradient descent, so its excess risk guarantee is literally an online-to-batch conversion of a regret bound; the distributional assumption only enters at the conversion step, not the algorithm. Worth writing that out in prose when polishing.

## The coupling, and why this course exists

An interesting note: if we can solve for the empirical risk minimizer exactly, then term (2) goes to zero.

The difference is worth stating, since it is the actual novelty of this course. In 210B you took \\(\theta\_t=\hat\theta\_n\\), the exact ERM; then term (2) is \\(\le 0\\) by definition and vanishes, and everything collapses to

$$
L(\hat\theta_n)-L(\theta^\star)\le 2\sup_\theta\lvert L_n(\theta)-L(\theta)\rvert
$$

— literally the display in §7.1 of my 210B notes, symmetrization and all. The new move here is keeping (2) alive, because in deep learning you never solve ERM exactly, and *which* near-minimizer the algorithm lands on determines what (1) looks like. Terms (1) and (2) stop being independent. That coupling is what "learning is optimization" means as a research program, and it is why implicit bias, algorithmic stability, and trajectory-dependent bounds show up later in the course.

---

**By the way:** Jason spent part of lecture on convexity rules of thumb — his message (via Boyd's class) being that memorizing composition rules beats computing second derivatives every time. That material lives in its own reference post, [Convexity Tips: Composition Rules Worth Memorizing]({{ site.baseurl }}/machine-learning-almanac/stat241a/convexity-tips). It's important, it's useful, and you should read it — convexity is the dividing line this whole course keeps coming back to.

<!-- TODO (from source notes): outline items 3–5 — convexity as the dividing line
     (now pointed to via the convexity-tips post), [the excess risk decomposition — done above],
     and the connection back to "learning is optimization" (partially covered by the coupling section). -->
