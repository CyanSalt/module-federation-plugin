### [0.8.4](https://github.com/CyanSalt/module-federation-plugin/compare/v0.8.3...v0.8.4) (2022-02-28)


### Bug Fixes

* runtime globals ([334d7d9](https://github.com/CyanSalt/module-federation-plugin/commit/334d7d995b1d693a72d6be2744dc184f7f0b2a19))

### [0.8.3](https://github.com/CyanSalt/module-federation-plugin/compare/v0.8.2...v0.8.3) (2022-02-28)


### Bug Fixes

* missing code when `script` as `remoteType` ([d2c02f0](https://github.com/CyanSalt/module-federation-plugin/commit/d2c02f0ea128871f151dcd2202afbe73585d0882))

### [0.8.2](https://github.com/CyanSalt/module-federation-plugin/compare/v0.8.1...v0.8.2) (2022-02-28)


### Bug Fixes

* type error ([a901dcf](https://github.com/CyanSalt/module-federation-plugin/commit/a901dcfd06d969f2c0e28fa74b180167b02f5da8))

### [0.8.1](https://github.com/CyanSalt/module-federation-plugin/compare/v0.8.0...v0.8.1) (2022-02-28)


### Bug Fixes

* compatible with webpack@5 ([2e790a5](https://github.com/CyanSalt/module-federation-plugin/commit/2e790a5d0b9456b2bc47809ba1c75a930b954302))

## [0.8.0](https://github.com/CyanSalt/module-federation-plugin/compare/v0.7.1...v0.8.0) (2022-02-28)


### Features

* add `additionalFeatures` option ([3aac561](https://github.com/CyanSalt/module-federation-plugin/commit/3aac5614785ebf2fd385c48093f081658efbfc5b))
* lookup ids start with `./` ([629d46b](https://github.com/CyanSalt/module-federation-plugin/commit/629d46bd91ac8d848da84030cc2906f08c92ff98))
* remove the fallback value of `filename` ([aedccc6](https://github.com/CyanSalt/module-federation-plugin/commit/aedccc6a8cb0df277e1571b35510b0b82ec05257))
* replace `lazyOnce` with `keepAsync` ([fecf64f](https://github.com/CyanSalt/module-federation-plugin/commit/fecf64fd7acda6411d155befebccdbb09b48fc39))
* set `library.type` to `var` by default ([f4aad4d](https://github.com/CyanSalt/module-federation-plugin/commit/f4aad4d242e773ad55cd3b13ae114cdba327a1f5))

### [0.7.1](https://github.com/CyanSalt/module-federation-plugin/compare/v0.7.0...v0.7.1) (2021-12-29)


### Bug Fixes

* add type to dependencies ([ac430c6](https://github.com/CyanSalt/module-federation-plugin/commit/ac430c6b7ef943fb1698d3424c88f4887916ddac))

## [0.7.0](https://github.com/CyanSalt/module-federation-plugin/compare/v0.6.1...v0.7.0) (2021-11-09)


### Features

* add `lazyOnce` option ([b462027](https://github.com/CyanSalt/module-federation-plugin/commit/b462027fcc852a0233fcb14f7c9f5551ca85591f))

### [0.6.1](https://github.com/CyanSalt/module-federation-plugin/compare/v0.6.0...v0.6.1) (2021-10-26)


### Bug Fixes

* main field in package.json ([7a8b646](https://github.com/CyanSalt/module-federation-plugin/commit/7a8b646f3795bf0d21b046a0fd4a132ef028989c))

## [0.6.0](https://github.com/CyanSalt/module-federation-plugin/compare/v0.6.0...v0.6.1) (2021-08-11)


### Features

* add shareScope and init to container entries ([c94de70](https://github.com/CyanSalt/module-federation-plugin/commit/c94de7056935ee425fd303493e1591cf17acfa05))
* support shortcut syntax ([55e5f40](https://github.com/CyanSalt/module-federation-plugin/commit/55e5f40895110c923012befa35c400eaee7f416e))

### [0.5.2](https://github.com/CyanSalt/module-federation-plugin/compare/v0.6.0...v0.6.1) (2021-08-05)


### Bug Fixes

* jsonpFunction conflict ([98db675](https://github.com/CyanSalt/module-federation-plugin/commit/98db6750ac8679ef9721bf376005c47bea2f345a))

### [0.5.1](https://github.com/CyanSalt/module-federation-plugin/compare/v0.6.0...v0.6.1) (2021-08-05)


### Bug Fixes

* add assets before optimized ([ec941ac](https://github.com/CyanSalt/module-federation-plugin/commit/ec941ac500365b5f8d96e76d8ae63195eaf9ba0f))

## [0.5.0](https://github.com/CyanSalt/module-federation-plugin/compare/v0.6.0...v0.6.1) (2021-08-03)


### Features

* support `asyncChunkMode` ([910f4c1](https://github.com/CyanSalt/module-federation-plugin/commit/910f4c1fa3c743b8f6ccfc91a6706793b57d42e1))

## [0.4.0](https://github.com/CyanSalt/module-federation-plugin/compare/v0.6.0...v0.6.1) (2021-08-03)


### Features

* add more schemas ([2a6ed33](https://github.com/CyanSalt/module-federation-plugin/commit/2a6ed33cd546c1f4f95c10d82c44a1536fbcab14))
* define remote modules as esm ([4226962](https://github.com/CyanSalt/module-federation-plugin/commit/422696265c3abef64d010e0b1d25b028d1841eb5))
* exports getters ([00f5ac2](https://github.com/CyanSalt/module-federation-plugin/commit/00f5ac23a6cd937e156fb28a07cafa7e9d003350))
* support chunk name for container ([ca9c62f](https://github.com/CyanSalt/module-federation-plugin/commit/ca9c62feb13c1b3d7fd0e3f28b5865429e219b0c))
* sync features from webpack ([3da8d46](https://github.com/CyanSalt/module-federation-plugin/commit/3da8d469f5e63ed1f310f82197e21c70dac20d74))


### Bug Fixes

* exposed dependency ([57ef01f](https://github.com/CyanSalt/module-federation-plugin/commit/57ef01f5c411ce56182e9b1cbdcba139660be56f))
* keep original codes ([b6e6d5d](https://github.com/CyanSalt/module-federation-plugin/commit/b6e6d5dd020903127be6dfaebae0a1311b6b5bf5))

### [0.1.1](https://github.com/CyanSalt/module-federation-plugin/compare/v0.6.0...v0.6.1) (2021-07-30)


### Features

* add defaults ([ae5d0b9](https://github.com/CyanSalt/module-federation-plugin/commit/ae5d0b9740996ceb579626a0121fc0ef1daa8cfa))

## [0.1.0](https://github.com/CyanSalt/module-federation-plugin/compare/v0.6.0...v0.6.1) (2021-07-30)

