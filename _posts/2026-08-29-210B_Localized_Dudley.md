---
title: "Localized Dudley Entropy Integral"
date: 2026-08-29
modified: 2026-08-29
permalink: /machine-learning-almanac/stat210b/localized-dudley
tags:
  - STAT 210B
  - Empirical Processes
  - Chaining
excerpt: "Chaining across all resolution scales at once: process complexity is the integral of root-entropy, localized to a ball."
toc: false
author_profile: false
hide_from_archive: true
sidebar:
  title: "ML Almanac"
  nav: sidebar-almanac
---

*Part of the [STAT 210B Results Toolbox]({{ site.baseurl }}/machine-learning-almanac/): the result as stated in my 210B notes (§9.7, Prop. 9.19), plus the one proof step to recall to remember why it is true.*

## Statement

**Proposition 9.19 (§9.7):** with the localization \\(T\_n(\delta) = \\{g\in\mathcal{F}^\star : \lVert g\rVert\_n\le\delta\\}\\) — note the *shifted* class \\(\mathcal{F}^\star\\), which is star-shaped around \\(0\\) — the localized Gaussian complexity satisfies

$$
G_n(\delta;\mathcal{F}^\star) \;\le\; \frac{C}{\sqrt n}\int_0^\delta \sqrt{\log N\big(T_n(\delta),\ \lVert\cdot\rVert_n,\ \epsilon\big)}\,d\epsilon .
$$

Setup from the 210B proof: the increments \\(X\_g = \frac1n\sum\_i w\_i g(X\_i)\\) form a Gaussian process whose canonical metric is \\(\frac{1}{\sqrt n}\lVert\cdot\rVert\_n\\); star-shapedness of \\(\mathcal{F}^\star\\) gives \\(0\in T\_n(\delta)\\), and \\(\operatorname{diam}\le 2\delta/\sqrt n\\) caps the integral. (§9.6's Prop. 9.16 is an earlier, uncleaned draft of the same bound, not a rougher precursor.) Downstream in 210B: Cor. 9.21 is the critical-radius condition (Remark 9.22 gives the fixed-point reading), Thm. 9.23 shows that for polynomial entropy \\(\log N \le A\epsilon^{-p}\\) with \\(p\in(0,2)\\), \\(\delta\_n = C\_{A,p}(\sigma^2/n)^{1/(p+2)}\\) is a valid radius, giving the rate \\((\sigma^2/n)^{2/(p+2)}\\), and Remark 9.20 gives the chaining intuition.

## The fundamental step

**Chaining: apply the [maximal inequality]({{ site.baseurl }}/machine-learning-almanac/stat210b/maximal-inequality) once per resolution scale and sum.** Approximate each \\(g\\) by its nearest neighbor in an \\(\epsilon\_k\\)-net at dyadic scales \\(\epsilon\_k = \delta 2^{-k}\\), and telescope:

$$
X_g \;=\; X_{\pi_0(g)} + \sum_{k\ge1} \big( X_{\pi_k(g)} - X_{\pi_{k-1}(g)} \big).
$$

At level \\(k\\) there are at most \\(N(\epsilon\_k)\cdot N(\epsilon\_{k-1})\\) possible increments, each sub-Gaussian with scale \\(\propto \epsilon\_{k-1}/\sqrt n\\) (the canonical metric), so the maximal inequality prices level \\(k\\) at \\(\epsilon\_{k-1}\sqrt{\log N(\epsilon\_k)}/\sqrt n\\). Summing the levels is, up to constants, a Riemann sum for \\(\int\_0^\delta\sqrt{\log N(\epsilon)}\,d\epsilon\\).

**The memory hook: a single net pays \\(\text{radius}\times\sqrt{\log(\text{net size})}\\) and you're stuck choosing one scale; chaining refuses to choose, pays at every scale, and the geometric decay of the radii makes the total an integral. Localization just caps the top of the integral at \\(\delta\\).**

## Where it's used

- The covering-number route to deep networks in the [Rademacher complexity notes]({{ site.baseurl }}/machine-learning-almanac/stat241a/rademacher-complexity-bounds): Ma's \\(\log N \le R/\epsilon^2\\) bounds (Zhang 2002; Bartlett et al. 2017) feed localized Dudley to produce \\(R\_S = \widetilde O(\sqrt{R/n})\\).
- The 210B Remark 9.25 boundary: \\(\int\_0^\delta \epsilon^{-p/2}d\epsilon\\) converges iff \\(p<2\\), and \\(\log N \le R/\epsilon^2\\) sits exactly at the \\(p=2\\) borderline. Remark 9.25 calls \\(p\ge2\\) a genuine limitation of the chaining technique — bracketing entropy, Talagrand's \\(\gamma\_2\\) functional, or generic chaining are needed there. The \\(\widetilde O\\) log factor in Ma (5.95) is the Ma notes' way of handling that logarithmic divergence at the endpoint.
