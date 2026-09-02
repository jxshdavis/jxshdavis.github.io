---
title: "Talagrand's Contraction Lemma"
date: 2026-08-29
modified: 2026-08-29
permalink: /machine-learning-almanac/stat210b/talagrand-contraction
tags:
  - STAT 210B
  - Empirical Processes
excerpt: "Composing with a κ-Lipschitz function costs at most a factor κ in Rademacher complexity."
toc: false
author_profile: false
hide_from_archive: true
sidebar:
  title: "ML Almanac"
  nav: sidebar-almanac
---

*Part of the [STAT 210B Results Toolbox]({{ site.baseurl }}/machine-learning-almanac/): the result as stated in my 210B notes (the §7 opening: the Ledoux–Talagrand construction and its no-absolute-value companion), plus the one proof step to recall to remember why it is true.*

## Statement

The §7 opening gives two Rademacher versions, plus a Gaussian analogue proved via Sudakov–Fernique. Throughout, \\(T\subseteq\mathbb{R}^d\\).

**Ledoux–Talagrand construction.** If \\(\phi\_1,\dots,\phi\_d\\) are \\(1\\)-Lipschitz mapping \\(0\\) to \\(0\\), then

$$
\mathbb{E}\sup_{t\in T}\Big\lvert \sum_i \epsilon_i\,\phi_i(t_i) \Big\rvert
\;\le\;
2\,\mathbb{E}\sup_{t\in T}\Big\lvert \sum_i \epsilon_i\, t_i \Big\rvert .
$$

**Another prop, where there are no absolute values.** If \\(\phi\_1,\dots,\phi\_d\\) are \\(1\\)-Lipschitz functions, then

$$
\mathbb{E}\sup_{t\in T}\sum_i \epsilon_i\,\phi_i(t_i)
\;\le\;
\mathbb{E}\sup_{t\in T}\sum_i \epsilon_i\, t_i .
$$

The proof of the claim which has the absolute value bars is harder than the one without (by a lot). Note the no-absolute-value version has no factor \\(2\\) and needs no \\(\phi\_i(0)=0\\); the fundamental step below proves **that** version.

The function-class form (Ma Lemma 5.3): for \\(\phi\\) \\(\kappa\\)-Lipschitz, \\(R\_S(\phi\circ\mathcal{H}) \le \kappa\, R\_S(\mathcal{H})\\) — take \\(T = \\{(h(z\_1),\dots,h(z\_n)) : h\in\mathcal{H}\\}\\) and rescale.

## The fundamental step

**Peel off one coordinate at a time.** Average over \\(\epsilon\_d = \pm1\\) explicitly: the expectation over the last sign turns the sup into a sup over *pairs*,

$$
\tfrac12\sup_{t,s\in T}\Big[ A(t) + A(s) + \phi_d(t_d) - \phi_d(s_d) \Big],
$$

where \\(A\\) collects the first \\(d-1\\) terms. Lipschitzness gives \\(\phi\_d(t\_d)-\phi\_d(s\_d) \le \lvert t\_d - s\_d\rvert\\), and the symmetry of the pair \\((t,s)\\) — you may swap their names — lets you drop the absolute value and realize \\(\lvert t\_d - s\_d\rvert\\) as \\(\pm(t\_d - s\_d)\\), which reassembles into the same expression with \\(\phi\_d\\) replaced by the **identity** in coordinate \\(d\\). Iterate over all \\(d\\) coordinates. (The reason we can seemingly swap \\(\mathbb{E}\\) with the sups is that this particular expectation is a finite sum over the \\(2^d\\) sign configurations.)

**The memory hook: averaging over one sign creates a symmetric pair; Lipschitz turns \\(\phi\\)-increments into plain increments; pair-symmetry eats the absolute value. One coordinate at a time, \\(\phi\\) evaporates.**

## Where it's used

- Converting the margin-loss class into the raw hypothesis class in the [Rademacher complexity notes]({{ site.baseurl }}/machine-learning-almanac/stat241a/rademacher-complexity-bounds): \\(\ell\_\gamma\\) is \\(\tfrac1\gamma\\)-Lipschitz, so \\(R\_S(\mathcal{F}) \le \frac1\gamma R\_S(\mathcal{H})\\) — the step (5.7) that puts \\(\gamma\_{\min}\\) in the denominator of the margin bound.
- Stripping the ReLU in both two-layer network bounds (steps (5.50) and (5.70) there): \\(\phi = \mathrm{ReLU}\\) is \\(1\\)-Lipschitz, so the nonlinearity is free.
- The Lipschitz-composition arrow in the 210B §7.1 [symmetrization]({{ site.baseurl }}/machine-learning-almanac/stat210b/symmetrization) chain, replacing the loss-composed class by the predictor class.
