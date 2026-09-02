---
title: "Linear Regression: a covariance matching perspective"
published: false  # WIP — flip to true (or delete this line) when ready to publish
date: 2026-07-22
modified: 2026-07-22
permalink: /machine-learning-almanac/concepts/lin_reg
tags:
  - Linear Algebra
  - Regression
excerpt: "Regression as covariance matching, and why the eigenbasis turns one coupled problem into p simple ones."
header:
  teaser: "PCA_poster.png"
toc: false
author_profile: false
---

With \\(n\\) observations \\((y_i, \boldsymbol{x}_i)\\), \\(\boldsymbol{x}_i\in \mathbb R^{p}\\), \\(y_i\in \mathbb R\\), we assume

$$
\begin{aligned}
y_1 &= \beta_0 + \beta_1 x_{11} + \cdots + \beta_p x_{1p} + \epsilon_1 && \text{(equation 1)}\\
&\ \ \vdots && \quad \vdots\\
y_n &= \beta_0 + \beta_1 x_{n1} + \cdots + \beta_p x_{np} + \epsilon_n && \text{(equation } n)
\end{aligned}
$$

where \\(\epsilon_i \overset{\mathrm{iid}}{\sim} N(0,\sigma^2)\\).

We will often see these \\(n\\) equations compressed into a single expression using matrix notation.

$$
X=\begin{bmatrix}
1 & \boldsymbol{x}_1^\top	\\
\vdots & \vdots \\
1 & \boldsymbol{x}_n^\top
\end{bmatrix}
=\begin{bmatrix}
1 & x_{11} & \cdots & x_{1p}\\
\vdots & \vdots && \vdots \\
1 & x_{n1} & \cdots & x_{np}
\end{bmatrix}, \quad
\boldsymbol{y}=\begin{bmatrix}
y_1\\
\vdots \\
y_n
\end{bmatrix},\quad
\beta=\begin{bmatrix}
\beta_0\\
\vdots \\
\beta_p
\end{bmatrix}
$$

Our system of \\(n\\) equations above can now be expressed concisely as

$$\boldsymbol y = X\beta + \boldsymbol\epsilon$$

where \\(\boldsymbol\epsilon\\) is distributed as a multivariate normal random variable \\(N(0, \sigma^2 I_n)\\).

We can also treat the covariates as iid draws from some unknown distribution. To make this precise, let \\((\mathcal X, \mathcal Y)\\) denote a generic draw from that distribution: \\(\mathcal X = (\mathcal X_1,\dots,\mathcal X_p)^\top\\) is a random vector whose \\(j\\)th coordinate \\(\mathcal X_j\\) is the \\(j\\)th predictor, \\(\mathcal Y = \mathcal X^\top \beta + \varepsilon\\) is a scalar, and each observed pair \\((y_i, \boldsymbol{x}_i)\\) is an independent copy of \\((\mathcal Y, \mathcal X)\\). Note the two roles the data plays here: \\(\boldsymbol{x}_i\\) is the \\(i\\)th *row* of the design matrix, while \\(\mathcal X_j\\) is a scalar random variable describing the \\(j\\)th *column*.

A standard assumption we want to make clear at this point is **exogeneity**: every predictor is uncorrelated with the noise,

$$\mathrm{Cov}(\mathcal X_j, \varepsilon)=0, \qquad j = 1,\dots,p.$$

This is weaker than what the Gaussian model above gives us: it asks only for uncorrelatedness, not independence, and says nothing about the shape of the noise distribution. It will turn out to be all we need.

Now given a data set \\((\boldsymbol y, X)\\) our goal is to estimate the unknown \\(\beta\\). There are two standard routes you may be familiar with:

1. **The ordinary least squares estimator**

    $$\hat \beta_{\text{OLS}}=(X^\top X)^{-1}X^\top \boldsymbol y =\underset{\tilde \beta}{\arg \min}\left\lVert \boldsymbol y-X\tilde \beta \right\rVert_2^2.$$

    This approach can be seen as minimizing the empirical risk under the squared loss function. It also has a nice linear algebra perspective you may be familiar with: the predicted values \\(\hat{\boldsymbol y} = X \hat \beta_{\text{OLS}}\\) equal the projection of \\(\boldsymbol y\\) onto the span of the columns of \\(X\\) (with respect to the usual Euclidean inner product).

2. **The maximum likelihood estimator**

    $$\hat \beta_{\text{MLE}}=\underset{\beta}{\arg \max}\ L(\boldsymbol y\mid \beta) = \underset{\beta}{\arg \max} \prod_{i=1}^n p(y_i\mid \beta,\boldsymbol{x}_i)$$

    where \\(p\\) is the density of \\(y_i\\). It turns out that the MLE matches the OLS solution under our assumptions, since the noise is Gaussian.

In this post I want to explore a new motivation for this problem which arrives at the same solution, but which also provides us a nice way of interpreting what each term in the expression \\((X^\top X)^{-1} X^\top \boldsymbol y\\) is doing.

Assume going forward that \\(\beta_0=0\\) and \\(\mathbb E \mathcal [X]=0\\), in order to avoid some pesky mean tracking. This costs us nothing. Writing \\(\mu_{\mathcal X} = \mathbb E[\mathcal X]\\) and \\(\mu_{\mathcal Y} = \mathbb E[\mathcal Y] = \beta_0 + \mu_{\mathcal X}^\top \beta\\), the model implies

$$\mathcal Y - \mu_{\mathcal Y} = (\mathcal X-\mu_{\mathcal X})^\top \beta + \varepsilon,$$

so the centered variables satisfy an intercept-free model with the same slope vector \\(\beta\\); the intercept is recovered afterwards as \\(\beta_0 = \mu_{\mathcal Y} - \mu_{\mathcal X}^\top \beta\\). We can drop the column of \\(1\\)s from \\(X\\). Then \\(\beta \in \mathbb R^p\\).

## Covariance Matching

Now we make a key observation which deviates from how linear regression is usually motivated. Under our assumed statistical model (working with the generic draw \\((\mathcal X,\mathcal Y)\\), so that \\(\mathcal X_j\\) and \\(\varepsilon\\) are random variables, not observed values)

$$
\mathrm{Cov}(\mathcal X_j, \mathcal Y) = \mathrm{Cov}\Big(\mathcal X_j,\ \textstyle\sum_k \mathcal X_k \beta_k + \varepsilon\Big) = \sum_k \beta_k\, \mathrm{Cov}(\mathcal X_j, \mathcal X_k) + \mathrm{Cov}(\mathcal X_j,\varepsilon) = \mathrm{Cov}\Big(\mathcal X_j,\textstyle\sum_k \beta_k \mathcal X_k\Big).
$$

So we know that the true \\(\beta\\) must determine a linear combination of our different covariates such that the resulting covariance with \\(\mathcal X_j\\) matches the covariance between \\(\mathcal X_j\\) and \\(\mathcal Y\\).

Stacking over \\(j=1,\dots,p\\) gives the population normal equations

$$
\Sigma_{\mathcal X \mathcal Y} = \Sigma_{\mathcal X \mathcal X}\, \beta, \qquad
\Sigma_{\mathcal X \mathcal X} := \mathrm{Cov}(\mathcal X) \in \mathbb R^{p\times p}, \quad
\Sigma_{\mathcal X \mathcal Y} := \mathrm{Cov}(\mathcal X,\mathcal Y) \in \mathbb R^{p}.
$$

What happens if we choose our estimate \\(\hat \beta\\) to satisfy this criterion for each predictor \\(j=1,\dots, p\\)? Note that there is nothing to approximate here: this is \\(p\\) equations in \\(p\\) unknowns, and provided the sample covariance matrix is invertible we can satisfy every one of them exactly.

This is worth pausing on. We haven't minimized anything yet: this equation is a direct algebraic consequence of the model assumption \\(\mathcal Y=\mathcal X^\top\beta+\varepsilon\\) together with \\(\mathrm{Cov}(\mathcal X_j,\varepsilon)=0\\). Nothing about least squares or projections has been invoked. In fact the intercept never mattered: covariance annihilates constants, so \\(\Sigma_{\mathcal X \mathcal Y}=\Sigma_{\mathcal X \mathcal X}\beta\\) holds whether or not \\(\beta_0=0\\). The moment conditions identify the slope vector and say nothing about the intercept.

To turn this into an estimator we replace population covariances with their sample analogs. Writing \\(\tilde{X} = X - \boldsymbol 1\bar{\boldsymbol x}^\top\\) and \\(\tilde{\boldsymbol y} = \boldsymbol y - \bar{y}\boldsymbol 1\\) for the data centered at its *observed* column means,

$$
\hat\Sigma_{\mathcal X \mathcal X} = \tfrac{1}{n}\tilde{X}^\top \tilde{X}, \qquad
\hat\Sigma_{\mathcal X \mathcal Y} = \tfrac{1}{n}\tilde{X}^\top \tilde{\boldsymbol y},
$$

and the empirical moment condition \\(\hat\Sigma_{\mathcal X \mathcal X}\hat\beta = \hat\Sigma_{\mathcal X \mathcal Y}\\) is exactly the normal equations \\(\tilde{X}^\top \tilde{X} \hat\beta = \tilde{X}^\top \tilde{\boldsymbol y}\\) from before. (This is not a simplification: the slope estimates from OLS with an intercept on the raw data agree exactly with those from OLS without an intercept on the centered data.) So the same equation shows up for two different reasons: as the first-order condition of a minimization problem, and as the moment condition implied by the generative model.

## The covariance-matching perspective

Whether you arrive at \\(\Sigma_{\mathcal X \mathcal X}\beta=\Sigma_{\mathcal X \mathcal Y}\\) from the model above or from least squares empirical risk minimization, it says the same thing: \\(\beta\\) is chosen so that \\(\mathcal X^\top\beta\\) reproduces \\(\mathcal Y\\)'s covariance with every predictor,

$$
\mathrm{Cov}(\mathcal X_j,\, \mathcal X^\top\beta) = \mathrm{Cov}(\mathcal X_j,\, \mathcal Y) \qquad \text{for every } j = 1,\dots,p.
$$

This is the projection characterization in disguise. The space of mean-zero, finite-variance random variables is a Hilbert space under \\(\langle U, V\rangle := \mathrm{Cov}(U,V)\\), and \\(\mathcal X^\top\beta\\) is the projection of \\(\mathcal Y\\) onto \\(\mathrm{span}(\mathcal X_1,\dots,\mathcal X_p)\\) exactly when the residual \\(\mathcal Y - \mathcal X^\top\beta\\) is orthogonal to that subspace, i.e. uncorrelated with every \\(\mathcal X_j\\). If some predictor's covariance were still unmatched, that predictor could be used to shave more variance off the residual, so it can't be optimal.

Empirically, replace \\(\mathrm{Cov}(\cdot,\cdot)\\) with sample covariance, \\(\mathcal X_j, \mathcal Y\\) with centered data vectors \\(\boldsymbol{x_j}, \boldsymbol y \in \mathbb R^n\\), and \\(\mathrm{span}\\) with \\(\mathrm{col}(X)\\); the condition becomes \\(X^\top(\boldsymbol y - X\hat\beta) = 0\\), i.e. \\(X^\top X\hat\beta = X^\top \boldsymbol y\\).

## Diagonalizing the coupling

How can we better understand the solution to this system? We could just jump to \\(\hat \beta = (X^\top X)^{-1}X^\top \boldsymbol y\\) and call it a day but to me this feels unsatisfying. Like we saw in the [PCA discussion]({{ site.baseurl }}/machine-learning-almanac/concepts/pca), when trying to understand something which involves the covariance matrix \\(X^\top X\\) it can be very helpful to work with the diagonalization of this matrix.

Let \\(\boldsymbol e_1,\dots,\boldsymbol e_p\\) be the orthonormal eigenbasis of \\(X^\top X\\) from before, with eigenvalues \\(\lambda_1 \ge \cdots \ge \lambda_p \ge 0\\). We diagonalize as \\(X^\top X = V\Lambda V^\top\\), where \\(V = [\boldsymbol e_1 \cdots \boldsymbol e_p]\\) is the orthogonal matrix whose columns are the eigenvectors and \\(\Lambda = \mathrm{diag}(\lambda_1,\dots,\lambda_p)\\).[^sigma] Writing \\(X^\top \boldsymbol y = \sum_i c_i \boldsymbol e_i\\) with

$$c_i = \langle \boldsymbol e_i, X^\top \boldsymbol y\rangle = \langle X \boldsymbol e_i, \boldsymbol y\rangle$$

(note this expression is literally the sample covariance between the \\(\boldsymbol e_i\\) direction of our covariates and \\(\boldsymbol y\\)), the normal equations become, in this basis,

$$\lambda_i\, a_i = c_i, \qquad i = 1,\dots,p,$$

where \\(\hat\beta = \sum_i a_i \boldsymbol e_i\\). If we can determine which \\(a_i\\) solve the system, we can reassemble them to get the \\(\hat \beta\\) which also solves the system.

[^sigma]: In the PCA post this matrix of eigenvectors was called \\(P\\). Here we call it \\(V\\) to avoid a collision with the covariance matrices \\(\Sigma_{\mathcal X \mathcal X}, \Sigma_{\mathcal X \mathcal Y}\\) from the previous section.

The coupled \\(p\\)-dimensional system has become \\(p\\) independent, scalar equations, one per eigendirection.

$$(X^\top X)^{-1}X^\top \boldsymbol y = V \Lambda^{-1}V^\top \sum_i c_i \boldsymbol e_i = \sum_i \frac{c_i}{\lambda_i} \boldsymbol e_i$$

(Here we are assuming every \\(\lambda_i > 0\\) so that \\(\Lambda^{-1}\\) exists. The case \\(\lambda_i = 0\\) is exactly the failure mode we come back to at the end of this post.)

From the PCA post, recall that the \\(\boldsymbol e_i\\) tell us how to combine the \\(\boldsymbol{x}_i\\) in ways to preserve the maximal amount of observed variance, and also that if \\(i \neq j\\) then

$$\langle X\boldsymbol e_i, X\boldsymbol e_j\rangle=\langle \boldsymbol e_i, X^\top X \boldsymbol e_j\rangle=\langle \boldsymbol e_i, \lambda_j \boldsymbol e_j\rangle=0$$

i.e. the observed correlation between the data in directions \\(i\\) and \\(j\\) is zero.

## The perspective shift

Each of these scalar equations is just the single-variable regression slope formula, \\(a_i = c_i/\lambda_i\\), applied along direction \\(\boldsymbol e_i\\): \\(\lambda_i\\) is the sample variance of the data along \\(\boldsymbol e_i\\), and \\(c_i\\) is the covariance between the \\(\boldsymbol e_i\\)-scores and \\(\boldsymbol y\\).[^scaling] The eigenbasis of \\(X^\top X\\) is precisely the coordinate system in which the \\(p\\) correlated predictors behave like \\(p\\) independent ones, so that regression, usually a coupled system requiring a matrix inverse, decomposes into \\(p\\) separate univariate regressions, each solved by dividing a covariance by a variance.

[^scaling]: Both are unnormalized: \\(\lambda_i = \lVert X\boldsymbol e_i\rVert^2\\) is \\(n\\) times the sample variance, and \\(c_i\\) is \\(n\\) times the sample covariance. The factor of \\(n\\) cancels in the ratio \\(c_i/\lambda_i\\), which is why we can be casual about it.

Let's write the entire regression problem in terms of the eigenbasis. Since \\(V\\) is orthogonal, \\(V^{-1}=V^\top\\), so writing \\(\beta\\) in the eigenbasis, \\(\beta = \sum_i a_i \boldsymbol e_i = Va\\), is just a change of coordinates, invertible with \\(a = V^\top\beta\\). Substituting into the model,

$$\boldsymbol y = X\beta + \boldsymbol\epsilon = XV(V^\top\beta) + \boldsymbol\epsilon = Za + \boldsymbol\epsilon, \qquad Z := XV.$$

\\(Z\\)'s columns are \\(\boldsymbol z_i = X\boldsymbol e_i\\), exactly the principal component scores from before: the data projected onto each eigendirection. So \\(Za+\boldsymbol\epsilon\\) is the *same* regression problem, only with the original \\(p\\) predictor columns of \\(X\\) replaced by their \\(p\\) principal component scores, and \\(\beta\\) replaced by its coordinates \\(a\\) in that basis. Nothing has been lost; this is a relabeling, not an approximation.

The reason this relabeling helps is that \\(Z\\)'s columns are orthogonal:

$$Z^\top Z = V^\top X^\top X\,V = V^\top(V\Lambda V^\top)V = \Lambda,$$

diagonal. (Since \\(X\\) is centered, \\(Z^\top Z\\) diagonal means the principal component scores are literally uncorrelated with each other, so the \\(p\\) new "predictors" carry disjoint information by construction.)

This is the fact that does the real work, and it's worth stating as its own small claim: **whenever a design matrix has orthogonal columns, multiple regression decouples into separate simple regressions.** If \\(W^\top W\\) is diagonal, so is \\((W^\top W)^{-1}\\), with \\(i\\)th diagonal entry \\(1/\boldsymbol w_i^\top \boldsymbol w_i\\), so

$$\hat a = (W^\top W)^{-1}W^\top \boldsymbol y \quad\Longrightarrow\quad \hat a_i = \frac{\boldsymbol w_i^\top \boldsymbol y}{\boldsymbol w_i^\top \boldsymbol w_i},$$

which depends only on \\(\boldsymbol w_i\\) and \\(\boldsymbol y\\), not on any other column of \\(W\\).

It is worth being clear about why this is surprising in the general case and not here. Expanding the objective in the basis \\(\boldsymbol w_1,\dots,\boldsymbol w_p\\),

$$
\Big\lVert \boldsymbol y - \sum_i a_i \boldsymbol w_i \Big\rVert^2
= \lVert \boldsymbol y\rVert^2 - 2\sum_i a_i\, \boldsymbol w_i^\top \boldsymbol y + \sum_{i,j} a_i a_j\, \boldsymbol w_i^\top \boldsymbol w_j ,
$$

the cross terms \\(a_i a_j (\boldsymbol w_i^\top \boldsymbol w_j)\\), \\(i \neq j\\), are the only source of coupling: they record that how much of \\(\boldsymbol w_i\\) to use depends on how much of \\(\boldsymbol w_j\\) is already in the model, because \\(\boldsymbol w_j\\) is partly doing \\(\boldsymbol w_i\\)'s job. Orthogonality kills them, and the objective becomes a sum of \\(p\\) independent scalar parabolas, which is minimized term by term. Equivalently, in the language of the previous post, projection onto a span is not in general the sum of the projections onto the individual spanning vectors, since those double-count wherever the vectors overlap; orthogonality is exactly the condition under which the decomposition is valid. The matrix inverse \\((W^\top W)^{-1}\\) is the bookkeeping that undoes the overlaps, and it degenerates to a diagonal rescaling when there are none.

Regressing \\(\boldsymbol y\\) on all of \\(W\\) at once gives exactly the same \\(i\\)th coefficient as regressing \\(\boldsymbol y\\) on \\(\boldsymbol w_i\\) alone. Applying this with \\(W=Z\\):

$$\hat a_i = \frac{\boldsymbol z_i^\top \boldsymbol y}{\boldsymbol z_i^\top \boldsymbol z_i} = \frac{(X\boldsymbol e_i)^\top \boldsymbol y}{\lambda_i} = \frac{\boldsymbol e_i^\top(X^\top \boldsymbol y)}{\lambda_i} = \frac{c_i}{\lambda_i}.$$

So \\(\hat a_i\\) isn't just numerically equal to \\(c_i/\lambda_i\\), it *is* the ordinary least-squares slope from regressing \\(\boldsymbol y\\) on the single vector \\(\boldsymbol z_i\\), ignoring every other principal component score entirely. Rotating into the eigenbasis doesn't just make the algebra diagonal; it makes the \\(p\\) coupled regressions of the original problem into \\(p\\) literal, independent simple regressions, each solvable on its own. Transforming back, \\(\hat\beta = V\hat a = \sum_i \hat a_i \boldsymbol e_i = \sum_i (c_i/\lambda_i)\boldsymbol e_i\\), recovers the formula from before.

One more thing worth noting, since it sets up regularization later: this reparametrized model, "regress \\(\boldsymbol y\\) on the principal component scores," is the exact computation behind *principal component regression*. What we've derived here is PCR with all \\(p\\) components kept, an exact, lossless reparametrization of OLS. PCR-as-a-method makes one further move: truncate to the top \\(k<p\\) components, dropping the small-\\(\lambda_i\\) terms that were causing the instability, trading a little bias for a lot of variance reduction. That's a nice contrast to draw against ridge, which shrinks those terms instead of deleting them.

This also makes precise why regression coefficients can be unstable: \\(a_i = c_i/\lambda_i\\) divides by however much the data actually varies in direction \\(\boldsymbol e_i\\). When \\(\lambda_i\\) is small, the data carries almost no information along \\(\boldsymbol e_i\\), yet the formula still divides by it, amplifying whatever noise is present in \\(c_i\\). When \\(\lambda_i = 0\\) exactly, that direction lies in \\(\ker(X)\\) and \\(\hat\beta\\) is only identified up to an arbitrary component along \\(\boldsymbol e_i\\) (the affine-preimage fact from before, now visible term by term). This sensitivity, sitting entirely in the small-eigenvalue directions, is what regularization methods like ridge regression are designed to control.

That is the subject of the [next post]({{ site.baseurl }}/machine-learning-almanac/concepts/penalized_reg), where we take this same decoupled picture and ask what ridge, principal component regression, and the lasso each do to it.
