JSDoc 3 template for Controlsjs
---
- [Controlsjs](http://controlsjs.com/)
- [Controlsjs on GitHub](https://github.com/controlsjs/controls.js)
- [JSDoc3](https://github.com/jsdoc3/jsdoc)
- [JSDoc3 API Documentations](http://usejsdoc.org)

Usage
---
1. If you want to create documentations with sample files, you can use commands below.
```
$ npm install
$ grunt demo
```

2. You can see any output related jsdoc process with a `--debug` flag.
```
$ grunt demo --debug
```

3. If you already have jsdoc system, you can use this project as jsdoc template.
```
$ jsdoc -t `project folder` -c `configuration file` `source files` `README.md file`
```

conf.json
---
You can set options for customizing your documentations.

```
"templates": {
    "applicationName": "Demo",
    "meta": {
        "title": "",
        "description": "",
        "keyword": ""
    },
    "plugins": [
      "path/to/controlsjs-jsdoc/plugins/controlsjs" //add Controls.js dictionary plugin
    ],
    "sourceLinks": {
      "path/to/src/": "https://github.com/author/app/blob/master/src/%path%#L%lineno%"
    },
    "socialLinks": {
      "AnyName": "",
      "Email": "",
      "Forum": "",
      "Purchase": "",
      "GitHub": "",
      "Twitter": "",
      "Facebook": ""
    }
}
```

License
---
This project under the MIT License. and this project refered by default template for JSDoc 3.

[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/davidshimjs/jaguarjs-jsdoc/trend.png)](https://bitdeli.com/free "Bitdeli Badge")

