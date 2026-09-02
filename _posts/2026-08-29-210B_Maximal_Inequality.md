---
title: "Sub-Gaussian Maximal Inequality"
date: 2026-08-29
modified: 2026-08-29
permalink: /machine-learning-almanac/stat210b/maximal-inequality
tags:
  - STAT 210B
  - Concentration
excerpt: "The expected max of n sub-Gaussian variables costs only √(2 log n) — no independence required."
toc: false
author_profile: false
hide_from_archive: true
sidebar:
  title: "ML Almanac"
  nav: sidebar-almanac
---

*Part of the [STAT 210B Results Toolbox]({{ site.baseurl }}/machine-learning-almanac/): the result as stated in my 210B notes (Prop. 2.40 and Remark 2.41(2)), plus the one proof step to recall to remember why it is true.*

## Statement

**Proposition 2.40 (§2.6):** for zero-mean \\(\sigma\\)-sub-Gaussian \\(X\_1,\dots,X\_n\\) — **not necessarily independent** —

$$
\mathbb{E}\max_{i\in[n]} X_i \;\le\; \sigma\sqrt{2\log n}.
$$

Alternatively, given the \\(\psi\_2\\) norms: \\(\mathbb{E}\max(X\_1,\dots,X\_n) \le C\max\_i \lVert X\_i\rVert\_{\psi\_2}\sqrt{\log n}\\).

**Remark 2.41(2)** upgrades it to the two-sided version at the cost of doubling the count:

$$
\mathbb{E}\max_{i\in[n]}\lvert X_i\rvert \;\le\; \sigma\sqrt{2\log(2n)},
$$

by applying the one-sided bound to the \\(2n\\) variables \\(\\{\pm X\_i\\}\\).

## The fundamental step

Pass the max through the exponential, where it is dominated by the **sum**:

$$
\mathbb{E}\max_i X_i
\;\le\; \frac1\lambda\log \mathbb{E}\, e^{\lambda \max_i X_i}
\;=\; \frac1\lambda\log \mathbb{E}\max_i e^{\lambda X_i}
\;\le\; \frac1\lambda\log \sum_{i=1}^n \mathbb{E}\, e^{\lambda X_i}
\;\le\; \frac{\log n}{\lambda} + \frac{\lambda\sigma^2}{2},
$$

using Jensen for the first inequality and the sub-Gaussian MGF bound for the last. Optimizing at \\(\lambda = \sqrt{2\log n}/\sigma\\) gives the result.

> 🤖 **Claude:** verified against the 210B original (Prop. 2.40 / Remark 2.41(2), PDF p. 21). One heads-up: the notes' final proof line prints \\(\lambda^2\sigma^2/2\\), but dividing \\(\log(n\exp(\lambda^2\sigma^2/2))\\) by \\(\lambda\\) gives \\(\lambda\sigma^2/2\\) — the display above is the corrected version.

**The memory hook: max ≤ sum is a terrible bound — unless it happens inside a logarithm, where the sum of \\(n\\) equal MGFs costs only \\(\log n\\). No independence is used anywhere, because the sum bound never needs it.**

## Where it's used

- The engine behind **Massart's lemma** (Ma 5.8): each \\(X\_v = \frac1n\langle\sigma,v\rangle\\) is \\(\frac{\lVert v\rVert\_2}{n}\\)-sub-Gaussian by Hoeffding, and the maximal inequality over the finite set \\(Q\\) delivers \\(M\sqrt{2\log\lvert Q\rvert/n}\\) — see the [Rademacher complexity notes]({{ site.baseurl }}/machine-learning-almanac/stat241a/rademacher-complexity-bounds), where Massart drives the \\(\ell\_1\\)-constrained linear model bound (Ma 5.7).
- The single-scale version of the chaining argument in the [localized Dudley entropy integral]({{ site.baseurl }}/machine-learning-almanac/stat210b/localized-dudley): Dudley is this inequality applied once per resolution level and summed.
