---
title: "Penalized Regression: ridge, PCR, and lasso in the eigenbasis"
date: 2026-07-23
modified: 2026-07-23
permalink: /machine-learning-almanac/concepts/penalized_reg
tags:
  - Linear Algebra
  - Regularization
  - Regression
excerpt: "Three regularizers, one diagnosis: what ridge, PCR, and the lasso each do to the small-eigenvalue directions."
header:
  teaser: "PCA_poster.png"
toc: false
author_profile: false
---

In the [previous post]({{ site.baseurl }}/machine-learning-almanac/concepts/lin_reg) we found that rotating into the eigenbasis of \\(X^\top X\\) turns one coupled \\(p\\)-dimensional regression into \\(p\\) independent simple regressions. Writing \\(X^\top X = V\Lambda V^\top\\) with \\(V = [\boldsymbol e_1 \cdots \boldsymbol e_p]\\) orthogonal, and \\(c_i = \langle X\boldsymbol e_i, \boldsymbol y\rangle\\), the solution is

$$\hat\beta = \sum_i \frac{c_i}{\lambda_i}\, \boldsymbol e_i ,$$

a covariance divided by a variance, once per eigendirection. We closed by noting that small \\(\lambda_i\\) is trouble. This post is about what to do with that.

## Ridge

The classical framing for ridge regression adds an \\(L_2\\) penalty to the least squares objective:

$$\hat\beta^{\text{ridge}} = \underset{\beta}{\arg\min}\ \lVert \boldsymbol y - X\beta\rVert_2^2 + \lambda\lVert\beta\rVert_2^2 , \qquad \lambda > 0 .$$

Rather than start there, we can arrive at ridge from the decoupled picture of the previous post, where the penalty has a much more transparent job.

### Why OLS is unstable, quantitatively

Recall \\(\hat\beta = \sum_i (c_i/\lambda_i)\,\boldsymbol e_i\\), where \\(\lambda_i\\) is the variance of the data along \\(\boldsymbol e_i\\) and \\(c_i = \langle \boldsymbol z_i, \boldsymbol y\rangle\\) is the covariance between the scores \\(\boldsymbol z_i = X\boldsymbol e_i\\) and the response. We argued that small \\(\lambda_i\\) is dangerous because we are dividing by it. We can say exactly how dangerous. Under \\(\boldsymbol y = X\beta + \boldsymbol\epsilon\\) with \\(\mathrm{Cov}(\boldsymbol\epsilon) = \sigma^2 I\\), the \\(i\\)th coefficient in the eigenbasis is \\(\hat a_i = \boldsymbol z_i^\top \boldsymbol y/\lambda_i\\), so

$$\mathrm{Var}(\hat a_i) = \frac{\lVert \boldsymbol z_i\rVert^2 \sigma^2}{\lambda_i^2} = \frac{\sigma^2}{\lambda_i},$$

using \\(\lVert \boldsymbol z_i\rVert^2 = \boldsymbol e_i^\top X^\top X \boldsymbol e_i = \lambda_i\\). The variance of the estimate in a direction is *inversely* the variance of the data in that direction. Directions the data barely explores are precisely the directions in which the fitted coefficient is least trustworthy, and as \\(\lambda_i \to 0\\) the estimate blows up.

Notice what this formula does *not* contain: the response. \\(\mathrm{Var}(\hat a_i) = \sigma^2/\lambda_i\\) depends only on the design matrix, so the instability is knowable before a single \\(y_i\\) is observed. This will turn out to be the dividing line between ridge and PCR on one side and the lasso on the other.

### A one-dimensional picture

The cleanest way to see the mechanism is with two data points and no linear algebra at all. Take \\(x_1, x_2\\) and estimate the slope the obvious way:

$$\hat\beta = \frac{y_2 - y_1}{x_2 - x_1} = \frac{\beta(x_2 - x_1) + (\epsilon_2 - \epsilon_1)}{x_2 - x_1} = \beta + \frac{\epsilon_2 - \epsilon_1}{x_2 - x_1}.$$

The error term has standard deviation \\(\sigma\sqrt{2}/\lvert x_2 - x_1\rvert\\). The *signal* difference in \\(y\\) grows with the gap in \\(x\\), while the *noise* difference does not care about the gap at all. Squeeze the two points together and the denominator shrinks while the numerator stays put. Once they are close enough, the difference in \\(y\\) due to noise swamps the difference due to the true slope, and there is nothing left to estimate from. Slope is rise over run; you measure the rise with fixed noise \\(\sigma\\), and a short lever arm amplifies whatever measurement error you had.

With a full sample the same thing happens, with "the gap" replaced by the total spread \\(S = \sum_i x_i^2\\):

$$\hat\beta - \beta = \frac{\sum_i x_i\epsilon_i}{\sum_i x_i^2}, \qquad \mathrm{Var}(\hat\beta) = \frac{\sigma^2}{S}.$$

This is worth sitting with, because it is exactly the eigendirection formula above with \\(S\\) playing the role of \\(\lambda_i\\). The figure below is therefore not a simplified analogy: it is a picture of a *single eigendirection*. Multiple regression is \\(p\\) of these running side by side with different lever arms, and the spread slider is the eigenvalue.

Drag the spread slider first with the penalty at zero. Each faint line is a refit on a fresh draw of the noise, with the design held fixed, so the width of the fan is the sampling variability of \\(\hat\beta\\).

{% include ridge-fan.html %}

Now add some penalty. The fan narrows, but the whole fan rotates toward flat. Ridge does not recover a slope you could not see; it declines to guess. When the lever arm is too short to measure the tilt reliably, reporting "roughly flat" beats reporting a wildly variable number.

In this one-dimensional case \\(\hat\beta^{\text{ridge}} = \frac{S}{S+\lambda}\hat\beta^{\text{OLS}}\\), so

$$\mathrm{Var} = \frac{S\sigma^2}{(S+\lambda)^2}, \qquad \mathrm{Bias} = -\frac{\lambda\beta}{S+\lambda}, \qquad \mathrm{MSE} = \frac{S\sigma^2 + \lambda^2\beta^2}{(S+\lambda)^2}.$$

Differentiating the MSE gives something clean:

$$\frac{d}{d\lambda}\mathrm{MSE} = \frac{2S(\lambda\beta^2 - \sigma^2)}{(S+\lambda)^3} \quad\Longrightarrow\quad \lambda^\star = \frac{\sigma^2}{\beta^2}.$$

The optimal penalty is the noise-to-signal ratio, and it does not depend on \\(S\\) at all. Two things follow. First, since \\(\lambda^\star > 0\\) whenever \\(\sigma^2 > 0\\), *some* positive penalty always beats OLS; this is the one-dimensional shadow of the Hoerl–Kennard existence theorem. Second, what varies across eigendirections is not the optimal \\(\lambda\\) but how much you lose by getting it wrong. In a well-supported direction the MSE curve is nearly flat in \\(\lambda\\), and in a starved direction it is steep. That is why a single global \\(\lambda\\) is a reasonable compromise rather than an obvious mistake.

### Inflating the denominator

The instability is entirely a small-denominator problem, so the crudest possible repair is to make the denominators larger. Add a constant \\(\lambda > 0\\) to the variance of every eigendirection:

$$\hat\beta^{\text{ridge}} = \sum_i \frac{c_i}{\lambda_i + \lambda}\, \boldsymbol e_i .$$

This is exactly the closed-form ridge solution. Since \\(X^\top X = V\Lambda V^\top\\), we have \\(X^\top X + \lambda I = V(\Lambda + \lambda I)V^\top\\), because \\(\lambda I\\) is unchanged by the rotation, and therefore

$$(X^\top X + \lambda I)^{-1} X^\top \boldsymbol y = V(\Lambda+\lambda I)^{-1}V^\top X^\top \boldsymbol y = \sum_i \frac{c_i}{\lambda_i+\lambda}\, \boldsymbol e_i .$$

That \\(\lambda I\\) looks identical in every orthonormal basis is not an incidental convenience: it is the reason the penalty acts on each eigendirection separately, and it is the whole content of the method. Note also that \\(\lambda_i + \lambda > 0\\) always, so the inverse exists even when \\(X^\top X\\) is singular; ridge repairs the identifiability failure from the previous post as a side effect. In a null direction (\\(\lambda_i = 0\\), hence \\(\boldsymbol z_i = X\boldsymbol e_i = 0\\) and \\(c_i = 0\\)) it assigns the coefficient \\(0\\) rather than leaving it arbitrary.

### Ridge as p shrunken simple regressions

The parallel-simple-regression reading survives the penalty intact. Comparing term by term,

$$\hat a_i^{\text{ridge}} = \frac{c_i}{\lambda_i+\lambda} = \underbrace{\frac{\lambda_i}{\lambda_i+\lambda}}_{\text{shrinkage factor}} \cdot\, \hat a_i^{\text{OLS}} ,$$

so ridge is the same \\(p\\) independent univariate regressions as before, each multiplied by a factor in \\((0,1)\\). Crucially the factor is not uniform: it depends on how much data lives in that direction. When \\(\lambda_i \gg \lambda\\) the factor is nearly \\(1\\) and the direction is left essentially alone; when \\(\lambda_i \ll \lambda\\) the factor is nearly \\(0\\) and the direction is crushed toward the origin. Ridge shrinks hardest exactly where \\(\mathrm{Var}(\hat a_i) = \sigma^2/\lambda_i\\) said the estimate was least reliable, and barely at all where the data was informative.

The same factor governs the fitted values. Let \\(\boldsymbol u_i = \boldsymbol z_i/\sqrt{\lambda_i}\\), an orthonormal basis of the column space of \\(X\\) (the left singular vectors), so that \\(c_i = \langle \boldsymbol z_i, \boldsymbol y\rangle = \sqrt{\lambda_i}\,\langle \boldsymbol u_i, \boldsymbol y\rangle\\). Then

$$X\hat\beta^{\text{ridge}} = \sum_i \frac{c_i}{\lambda_i+\lambda}\, \boldsymbol z_i = \sum_i \frac{\lambda_i}{\lambda_i+\lambda}\,\langle \boldsymbol u_i, \boldsymbol y\rangle\, \boldsymbol u_i ,$$

against the OLS fit \\(X\hat\beta = \sum_i \langle \boldsymbol u_i, \boldsymbol y\rangle\, \boldsymbol u_i\\). OLS keeps each component of \\(\boldsymbol y\\) along the column space in full; ridge keeps the fraction \\(\lambda_i/(\lambda_i+\lambda)\\) of it.

### What the shrinkage buys

Shrinking a coefficient toward zero biases it, so this is a trade rather than a free improvement. Both sides are visible in the same factor. Since \\(\boldsymbol z_i^\top X\beta = \lambda_i a_i\\),

$$\mathbb E\big[\hat a_i^{\text{ridge}}\big] = \frac{\lambda_i}{\lambda_i+\lambda}\, a_i , \qquad \mathrm{Var}\big(\hat a_i^{\text{ridge}}\big) = \frac{\lambda_i\, \sigma^2}{(\lambda_i+\lambda)^2} = \Big(\frac{\lambda_i}{\lambda_i+\lambda}\Big)^{2} \frac{\sigma^2}{\lambda_i} .$$

The bias is proportional to the shrinkage factor and the variance to its square, so in the small-\\(\lambda_i\\) directions where OLS was worst the variance reduction is quadratic in a quantity the bias only pays for linearly. That is the sense in which ridge is buying a lot of variance cheaply, and it is buying it in exactly the directions where there was a lot to buy.

> **Remark.** Two practical points the eigen-picture makes easy to miss. First, \\(\lambda I\\) is not scale-invariant: rescaling a predictor changes the eigenvalues and hence how much that direction is penalized, so ridge presumes standardized predictors. Second, the intercept is conventionally left unpenalized. With centered \\(\boldsymbol y\\) and \\(X\\) it drops out of the problem entirely and is recovered afterward as \\(\hat\beta_0 = \bar y - \bar{\boldsymbol x}^\top \hat\beta\\).

## PCR: hard thresholding the same spectrum

The previous post already contains principal component regression: regressing \\(\boldsymbol y\\) on all \\(p\\) scores \\(\boldsymbol z_i = X\boldsymbol e_i\\) is a lossless reparametrization of OLS. PCR as a *method* makes one further move, keeping only the top \\(k\\) components:

$$\hat\beta^{\text{PCR}} = \sum_{i \le k} \frac{c_i}{\lambda_i}\, \boldsymbol e_i = \sum_i \mathbf 1(i \le k)\cdot \hat a_i^{\text{OLS}}\, \boldsymbol e_i .$$

Compared against ridge's \\(\hat a_i^{\text{ridge}} = \frac{\lambda_i}{\lambda_i+\lambda}\hat a_i^{\text{OLS}}\\), the two methods are the same shape. Both multiply each eigendirection's simple regression by a factor determined by \\(\lambda_i\\); they differ only in the factor:

$$w_i^{\text{ridge}} = \frac{\lambda_i}{\lambda_i+\lambda} \in (0,1), \qquad w_i^{\text{PCR}} = \mathbf 1(\lambda_i \ge \lambda_k) \in \{0,1\}.$$

Since the \\(\lambda_i\\) are sorted, truncating at index \\(k\\) is thresholding on eigenvalue. PCR deletes the unstable directions outright; ridge damps them continuously. Soft versus hard threshold, same axis.

The shrinkage factors are not merely analogous, they are measuring the same thing. Both methods produce fitted values of the form \\(\hat{\boldsymbol y} = \sum_i w_i \langle \boldsymbol u_i, \boldsymbol y\rangle\, \boldsymbol u_i\\) with \\(\boldsymbol u_i = \boldsymbol z_i/\sqrt{\lambda_i}\\), so both are linear in \\(\boldsymbol y\\): \\(\hat{\boldsymbol y} = S\boldsymbol y\\) for a matrix \\(S = \sum_i w_i \boldsymbol u_i \boldsymbol u_i^\top\\) that does not depend on \\(\boldsymbol y\\). The effective degrees of freedom is \\(\mathrm{Tr}(S) = \sum_i w_i\\), giving

$$\mathrm{df}(\text{OLS}) = p, \qquad \mathrm{df}(\text{PCR}) = k, \qquad \mathrm{df}(\text{ridge}) = \sum_i \frac{\lambda_i}{\lambda_i+\lambda} .$$

PCR spends an integer number of dimensions; ridge spends a fractional one, taking a partial dimension in each direction proportional to how much data supports it. The two sit on the same axis, differing only in whether the map from eigenvalue to weight is a step or a smooth curve.

## Lasso: the penalty picks a different basis

Lasso replaces the \\(\ell_2\\) penalty with \\(\ell_1\\):

$$\hat\beta^{\text{lasso}} = \underset{\beta}{\arg\min}\ \lVert \boldsymbol y - X\beta\rVert_2^2 + \lambda \lVert\beta\rVert_1 .$$

It is tempting to expect a third entry in the table above, some factor \\(w_i^{\text{lasso}}\\) applied to the eigendirections. There isn't one, and the reason is worth isolating, because it is the same fact that made ridge work.

### Why the eigenbasis argument fails

Ridge decoupled for one reason: writing \\(\beta = Va\\) in the orthonormal eigenbasis leaves the penalty unchanged,

$$\lVert\beta\rVert_2^2 = \lVert Va\rVert_2^2 = \lVert a\rVert_2^2 ,$$

because \\(V\\) is orthogonal. The squared \\(\ell_2\\) norm is rotation invariant, so rotating to the basis that diagonalizes the *loss* costs nothing on the *penalty*, and both terms are diagonal at once. Geometrically, the \\(\ell_2\\) ball is a sphere: it has no preferred directions, so it is happy to be described in whatever basis the data suggests.

The \\(\ell_1\\) norm is not rotation invariant. In general \\(\lVert Va\rVert_1 \neq \lVert a\rVert_1\\), so in eigencoordinates the lasso objective has a diagonal loss and a coupled penalty, and nothing separates. The \\(\ell_1\\) ball is a cross-polytope whose vertices sit on the *original coordinate axes*; those corners are what produce exact zeros, and they point at individual predictors, not at principal components. The penalty carries its own preferred basis and refuses to adopt the data's.

So lasso is not a different choice of \\(w_i\\). It is a method whose special basis is the predictor basis rather than the eigenbasis. (One could of course apply an \\(\ell_1\\) penalty to \\(a\\) instead of \\(\beta\\), which is a legitimate method that selects principal components; it is simply not the lasso.)

### What lasso does in its own basis

To see lasso's analogue of the shrinkage factor, take the case where the two bases coincide: suppose the columns of \\(X\\) are already orthonormal, \\(X^\top X = I\\), so every \\(\lambda_i = 1\\) and the coupling of the previous post is absent from the start. Writing \\(b = X^\top \boldsymbol y = \hat\beta^{\text{OLS}}\\),

$$\lVert \boldsymbol y - X\beta\rVert_2^2 = \lVert \boldsymbol y\rVert^2 - 2\beta^\top b + \lVert\beta\rVert^2 = \text{const} + \lVert \beta - b\rVert_2^2 ,$$

so the objective is \\(\sum_j \big[(\beta_j - b_j)^2 + \lambda\lvert\beta_j\rvert\big]\\), separable one coordinate at a time. Each scalar problem is solved by soft thresholding:

$$\hat\beta_j^{\text{lasso}} = \mathrm{sign}(b_j)\big(\lvert b_j\rvert - \tfrac{\lambda}{2}\big)_+ , \qquad\text{against}\qquad \hat\beta_j^{\text{ridge}} = \frac{b_j}{1+\lambda} .$$

Ridge multiplies by a constant; lasso subtracts a constant and clips at zero. The subtraction is what produces exact zeros, and it is also why lasso's shrinkage is not multiplicative by a \\(\boldsymbol y\\)-independent factor: the amount removed is fixed, so its *relative* effect depends on how large \\(b_j\\) happened to be. Consequently \\(\hat\beta^{\text{lasso}}\\) is a nonlinear function of \\(\boldsymbol y\\), and there is no matrix \\(S\\) with \\(\hat{\boldsymbol y} = S\boldsymbol y\\). The clean \\(\mathrm{Tr}(S)\\) accounting above has no exact counterpart, though the number of selected variables plays an analogous role.

Two caveats on this formula, since it is easy to overread. It is exact only for orthonormal design; for general \\(X\\) the lasso has no closed form at all. And in that orthonormal setting all \\(\lambda_i\\) are equal, so ridge and PCR become degenerate there and the comparison is not three-way. Soft thresholding is the right picture of *what lasso does to a coefficient*, not a solution formula.

### Correlated predictors, one coordinate at a time

The parallel-simple-regressions picture does survive for lasso, but as an algorithm rather than a closed form. Fixing all coordinates but the \\(j\\)th and letting \\(\boldsymbol r_{(-j)} = \boldsymbol y - \sum_{k \ne j} \boldsymbol x_k \hat\beta_k\\) be the partial residual, the same computation as above gives

$$\hat\beta_j \;\longleftarrow\; \frac{\mathrm{sign}(\boldsymbol x_j^\top \boldsymbol r_{(-j)})\big(\lvert \boldsymbol x_j^\top \boldsymbol r_{(-j)}\rvert - \tfrac{\lambda}{2}\big)_+}{\lVert \boldsymbol x_j\rVert^2} ,$$

a soft-thresholded simple regression of the partial residual on \\(\boldsymbol x_j\\). Cycling over \\(j\\) until convergence is coordinate descent, the standard lasso solver.

This is the decoupling story of the previous post replayed. Orthogonal columns mean one pass suffices and the coefficients never interact. Correlated columns mean each update disturbs its neighbours through the partial residual, so the sweep must be repeated. Ridge escaped this by rotating to a basis where the columns *are* orthogonal; lasso cannot rotate without destroying its penalty, so it pays for the coupling in iterations instead.

## Comparison

All three methods start from the same diagnosis, that \\(\hat a_i = c_i/\lambda_i\\) has variance \\(\sigma^2/\lambda_i\\) and so is unreliable where the data is thin. They differ in what they act on and what information they use to decide.

| Method | Basis | Shrinks based on | Linear in \\(\boldsymbol y\\)? |
|---|---|---|---|
| OLS | any | nothing | yes |
| Ridge | eigenbasis of \\(X^\top X\\) | \\(\lambda_i\\), smoothly | yes |
| PCR | eigenbasis of \\(X^\top X\\) | \\(\lambda_i\\), by cutoff | yes |
| Lasso | original predictors | \\(\lvert \boldsymbol x_j^\top \boldsymbol r\rvert\\), by threshold | no |

The third column is the one that repays attention. Ridge and PCR choose their shrinkage from \\(\lambda_i\\) alone, a property of the design matrix: they can be computed before \\(\boldsymbol y\\) is observed, and they are agnostic about which directions actually predict the response. They stabilize directions the data explores weakly, whether or not those directions matter. Lasso thresholds on a response-dependent quantity, so it can retain a low-variance predictor that happens to be strongly associated with \\(\boldsymbol y\\) and discard a well-supported one that isn't. The price is that it forfeits the closed form, the linearity in \\(\boldsymbol y\\), and the clean spectral accounting the other two inherit from the eigenbasis.
