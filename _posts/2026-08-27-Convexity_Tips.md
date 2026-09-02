---
title: "Convexity Tips: Composition Rules Worth Memorizing"
date: 2026-08-27
modified: 2026-08-29
permalink: /machine-learning-almanac/stat241a/convexity-tips
tags:
  - Convexity
  - Optimization
  - STAT 241A
excerpt: "The scalar and vector composition rules from Boyd & Vandenberghe, plus flash cards for the mental convexity toolkit."
toc: false
author_profile: false
sidebar:
  title: "ML Almanac"
  nav: sidebar-almanac
---

*Companion reference for the [STAT 241A day 1 notes]({{ site.baseurl }}/machine-learning-almanac/stat241a/learning-as-optimization). This follows Boyd and Vandenberghe, [Convex Optimization](https://web.stanford.edu/~boyd/cvxbook/) (Cambridge, 2004), §3.2.4, pp. 83–87, and the EE364a lecture slides on convex functions, slides 3.23–3.25. The three-clause form of the general composition rule is the DCP rule used by CVX; the book's own vector composition statement is the two-clause version.*

## Composition with scalar functions

Given \\(g:\mathbb{R}^n \to \mathbb{R}\\) and \\(h:\mathbb{R} \to \mathbb{R}\\), define the composition \\(f = h \circ g\\), i.e. \\(f(x) = h(g(x))\\).

\\(f\\) is convex when either

- \\(g\\) is convex, \\(h\\) is convex, and \\(\tilde{h}\\) is nondecreasing; or
- \\(g\\) is concave, \\(h\\) is convex, and \\(\tilde{h}\\) is nonincreasing.

The monotonicity condition must hold for the extended-value extension \\(\tilde{h}\\), not merely for \\(h\\) on its domain.

*Proof sketch* (\\(n = 1\\), with \\(g,h\\) twice differentiable):

$$
f''(x) = h''\big(g(x)\big)\, g'(x)^2 + h'\big(g(x)\big)\, g''(x).
$$

Each term is nonnegative under the hypotheses above, so \\(f'' \geq 0\\).

**Examples.**

- \\(f(x) = \exp g(x)\\) is convex whenever \\(g\\) is convex.
- \\(f(x) = 1/g(x)\\) is convex whenever \\(g\\) is concave and positive.

## Vector composition

Let \\(g:\mathbb{R}^n \to \mathbb{R}^k\\) with components \\(g\_1,\ldots,g\_k\\), let \\(h:\mathbb{R}^k \to \mathbb{R}\\), and define \\(f = h \circ g\\), i.e.

$$
f(x) = h\big(g(x)\big) = h\big(g_1(x),\, g_2(x),\, \ldots,\, g_k(x)\big),
$$

$$
\operatorname{\mathbf{dom}} f = \Big\{\, x \in \textstyle\bigcap_{i=1}^{k} \operatorname{\mathbf{dom}} g_i \ \Big|\ g(x) \in \operatorname{\mathbf{dom}} h \,\Big\}.
$$

Monotonicity below always refers to the extended-value extension \\(\tilde{h}:\mathbb{R}^k \to \mathbb{R}\cup\\{\pm\infty\\}\\), defined by \\(\tilde{h}(z) = h(z)\\) for \\(z \in \operatorname{\mathbf{dom}} h\\), and \\(\tilde{h}(z) = +\infty\\) off the domain when \\(h\\) is convex (\\(-\infty\\) when \\(h\\) is concave).

**Convexity.** \\(f\\) is convex if \\(h\\) is convex and, for each \\(i = 1,\ldots,k\\), at least one of the following holds:

- \\(g\_i\\) is convex and \\(\tilde{h}\\) is nondecreasing in its \\(i\\)th argument;
- \\(g\_i\\) is concave and \\(\tilde{h}\\) is nonincreasing in its \\(i\\)th argument;
- \\(g\_i\\) is affine.

The conditions may be satisfied by different clauses for different \\(i\\).

**Concavity.** \\(f\\) is concave if \\(h\\) is concave and, for each \\(i\\), either \\(g\_i\\) is concave with \\(\tilde{h}\\) nondecreasing in argument \\(i\\), or \\(g\_i\\) is convex with \\(\tilde{h}\\) nonincreasing in argument \\(i\\), or \\(g\_i\\) is affine.

*Proof sketch* (convex case, \\(n = 1\\), with \\(g\\) and \\(h\\) twice differentiable and \\(\operatorname{\mathbf{dom}} h = \mathbb{R}^k\\)):

$$
f''(x) = g'(x)^{T} \nabla^{2} h\big(g(x)\big)\, g'(x)
       + \nabla h\big(g(x)\big)^{T} g''(x)
       = g'(x)^{T} \nabla^{2} h\big(g(x)\big)\, g'(x)
       + \sum_{i=1}^{k} \frac{\partial h}{\partial z_i}\big(g(x)\big)\, g_i''(x).
$$

The first term is nonnegative since \\(\nabla^2 h \succeq 0\\). In the sum, each term is nonnegative: the two factors share a sign under the first two clauses, and \\(g\_i'' = 0\\) under the third. Hence \\(f'' \geq 0\\).

## The convexity toolkit

> ✏️ **Josh:** I think it would be cool to end this post with some physical boxes that resemble flash cards of the helpful rules to memorize. This is because Jason said the message from Boyd's class is that the basic way to check convexity is by computing second derivatives; however, memorizing rules of thumb is a better way. I want to have concrete facts to memorize so that my mental convexity toolkit is sufficient.
>
> 🤖 **Claude:** Drafted below — a first pass at the cards, built only from the rules above. Restyle/reword freely; the last card is the "gotcha" that catches most mistakes in practice.

<style>
.flashcard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px; margin: 1.2em 0; }
.flashcard { border: 1.5px solid currentColor; border-radius: 6px; padding: 0.8em 1em; }
.flashcard .fc-title { font-weight: 700; font-size: 0.85em; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.4em; }
</style>

<div class="flashcard-grid">
  <div class="flashcard">
    <div class="fc-title">Card 1 · cvx ∘ cvx</div>
    \(g\) convex, \(h\) convex, \(\tilde h\) <b>nondecreasing</b> \(\Rightarrow h\circ g\) convex.<br><br>
    <em>Mnemonic: "increasing convex of convex is convex."</em>
  </div>
  <div class="flashcard">
    <div class="fc-title">Card 2 · cvx ∘ ccv</div>
    \(g\) concave, \(h\) convex, \(\tilde h\) <b>nonincreasing</b> \(\Rightarrow h\circ g\) convex.<br><br>
    <em>Flipping \(g\) requires flipping \(h\)'s monotonicity.</em>
  </div>
  <div class="flashcard">
    <div class="fc-title">Card 3 · exp</div>
    \(e^{g(x)}\) is convex whenever \(g\) is convex.<br><br>
    <em>Instance of Card 1: \(e^z\) is convex and increasing.</em>
  </div>
  <div class="flashcard">
    <div class="fc-title">Card 4 · reciprocal</div>
    \(1/g(x)\) is convex whenever \(g\) is concave and positive.<br><br>
    <em>Instance of Card 2: \(1/z\) is convex, decreasing on \(z>0\).</em>
  </div>
  <div class="flashcard">
    <div class="fc-title">Card 5 · vector rule</div>
    \(h(g_1,\dots,g_k)\) convex if \(h\) convex and each slot \(i\) satisfies one of: \(g_i\) cvx + \(\tilde h\) nondecr. in \(i\); \(g_i\) ccv + \(\tilde h\) nonincr. in \(i\); \(g_i\) affine.<br><br>
    <em>Different slots may use different clauses. Affine always works.</em>
  </div>
  <div class="flashcard">
    <div class="fc-title">Card 6 · the gotcha</div>
    Monotonicity must hold for the <b>extended-value extension</b> \(\tilde h\) (value \(+\infty\) off \(\operatorname{\mathbf{dom}} h\)), not just for \(h\) on its domain.<br><br>
    <em>This is the clause that silently fails when a rule "should" apply but doesn't.</em>
  </div>
</div>
