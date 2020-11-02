# webpack-boilerplate


### node-gyp issues

Installing on some versions of OSX may raise errors with node-gyp

```
Error: gyp failed with exit code: 1
```
[Solution for this problem](https://github.com/nodejs/node-gyp/issues/1927#issuecomment-544499926)

---

### libpng issues

Installing on some versions of OSX may raise errors with a [missing libpng dependency](https://github.com/tcoopman/image-webpack-loader/issues/51#issuecomment-273597313): 
```
Module build failed: Error: dyld: Library not loaded: /usr/local/opt/libpng/lib/libpng16.16.dylib
```
This can be remedied by installing the newest version of libpng with [homebrew](http://brew.sh/):

```sh
brew install libpng
```

---

### autoconf issues

Installing on some versions of Linux may show error with autoconf 

```
Error: Command failed: /bin/sh -c autoreconf -ivf 
```

to fix this install dh-autoreconf. [Solution method 1](https://github.com/imagemin/imagemin-gifsicle/issues/37#issuecomment-577889854):
```sh
apt-get install dh-autoreconf
```

or install autoconf [Solution method 2](https://github.com/JeffreyWay/laravel-mix/issues/1480#issuecomment-370934011)
```sh
apt-get install autoconf
```
or even

```sh
apt-get install autoconf libtool pkg-config nasm build-essential
```
---

