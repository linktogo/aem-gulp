'use strict';

var gulp					 = require('gulp'),
    sass					 = require('gulp-sass'),
    connect					 = require('gulp-connect'),
    iconfont				 = require('gulp-iconfont'),
    svgmin					 = require('gulp-svgmin'),
    concat					 = require('gulp-concat'),
    sonar					 = require('gulp-sonar'),
    util					 = require('util'),
    jasminebrowser			 = require('gulp-jasmine-browser'),
    jsdoc					 = require('gulp-jsdoc3'),
    shell					 = require('gulp-shell'),
    notify					 = require('gulp-notify'),
    plumber					 = require('gulp-plumber'),
    gutil					 = require('gulp-util'),
    bower                    = require('gulp-bower'),
    banner                   = require('gulp-banner'),
    del                      = require('del'),
    rename                   = require('gulp-rename'),
    runSequence				 = require('run-sequence'),
    replace                  = require('gulp-string-replace'),
    fs                       = require('fs'),
    path                     = require('path'),
    glob                     = require("glob"),
    compress                 = require('gulp-yuicompressor'),
    // Syntax coding dependencies
    jshint					 = require('gulp-jshint'),
    csslint                  = require('gulp-csslint'),
    browserSync				 = require('browser-sync').create(),
    // Json configuration file
    jsDocConfig			     = require('./docs/jsdoc.conf.json'),
    //
    pkg                      = require('./package.json'),
    // Paths
    conf					 = require('./conf.json'),
    livereload_path_system	 = '',
    livereload_pathArray	 = '',
    livereload_componentPath = '',
    livereload_fileName		 = '',

    // Call back error
    beepError				 = function (err) {
        gutil.beep();
        console.log(err);
    },
    // Check debug
    isdebug				 = function (err) {
        return (conf.debug==='on');
    },
    // Check author
    isAuthor				 = function (err) {
        return (conf.author==='on');
    },
    // Check publish
    isPublish				 = function (err) {
        return (conf.publish==='on');
    },
    // Call back error
    getDate 				 = function () {
        return new Date().toISOString();
    },

    /**
     * SPRITE CREATION DEPENDENCIES
     * @type {{src: string, dest: string}}
     */
    basePaths = {
        src: path.resolve(__dirname) + conf.sprite.devSrcDir,
        dest: path.resolve(__dirname) + conf.sprite.assetsSrcDir
    },
    paths_sprites = {
        images: {
            src: basePaths.src + 'img/',
            dest: basePaths.dest + 'img/'
        },
        sprite: {
            src: basePaths.src + 'sprite/*',
            svg: 'img/sprite.svg',
            css: basePaths.src + 'sass/utils/sprite/_sprite.scss'
        },
        templates: {
            src: basePaths.src + 'tpl/'
        }
    },
    svgSprite				 = require('gulp-svg-sprite'),
    svg2png					 = require('gulp-svg2png'),
    size					 = require('gulp-size'),
    autoprefixer			 = require('gulp-autoprefixer'),
    uglify					 = require('gulp-uglify'),
    changeEvent				 = function(evt) {
        console.log('changeEvent - onChange evt : ', evt);
        gutil.log('File', gutil.colors.cyan(evt.path.replace(new RegExp('/.*(?=/' + basePaths.src + ')/'), '')), 'was', gutil.colors.magenta(evt.type));
    };







/**********************************************************************************************************************
 * STYLE                                                                                                         BEGIN
 *********************************************************************************************************************/
gulp.task('sass', function () {
    return gulp.src(conf.projectPath + 'src/scss/**/*.scss')
        .pipe(sass())
        .on('error', sass.logError)
        .pipe(gulp.dest(conf.projectPath + 'clientlibs/'));
});

// SASS TASK : Sass watch
gulp.task('sass:watch', function () {
    gulp.watch(conf.projectPath + 'src/scss/**/*.scss', function (event){
        console.log (event);

        runSequence('sass');

    });

    gulp.watch(conf.projectPath + 'clientlibs/**/*.css', function (event){
        livereload_path_system	 = event.path.replace(/\\/g, '/');

        if (conf.debug) console.log (livereload_path_system);

        livereload_pathArray = livereload_path_system	.split('/');
        livereload_fileName = livereload_pathArray[livereload_pathArray.length - 1];
        livereload_componentPath = livereload_path_system	.replace(livereload_path_system	.split("/etc/designs/")[0]+'/etc/designs/', '');
        runSequence('curl-vault');
        runSequence('browser-sync:reload');
    });
});

// FILE TASK : Check CSS code with csslint, just doesn't work
gulp.task('csslint', function() {
    gulp.src(conf.projectPath + '/**/*.css')
        .pipe(csslint())
        .pipe(csslint.formatter());
});

/**********************************************************************************************************************
 * STYLE                                                                                                          END
 *********************************************************************************************************************/

/**********************************************************************************************************************
 * BOWER                                                                                                        BEGIN
 *********************************************************************************************************************/
// JS PACKAGES AND DEPENDENCIES MANAGEMENT
gulp.task('bower', function() {
    return bower('./bower_components');
});

// FILE TASK : copy JS files located in 'bower_component' directory to src projest directory
gulp.task('copy:bower', function () {
    // copy all minified JS files from bower_components to src project directory
    // And store their into the array list
    return glob('./bower_components_vca/**/*.js', function(err, files) {
        for (var i=0; i<files.length; i++) {
            gulp.src(files[i])
                .pipe(gulp.dest(conf.projectPath + 'src/js/publish/scripts/00-vendor/'));
        }
    });
});

/**********************************************************************************************************************
 * BOWER                                                                                                          END
 *********************************************************************************************************************/

/**********************************************************************************************************************
 * COPY STATIC                                                                                                   BEGIN
 *********************************************************************************************************************/

gulp.task('copy:static', function() {
    console.log ("copy:static => copy contenu");
    gulp.src(conf.projectPath + 'static/**')
        .pipe(gulp.dest(conf.projectPath + 'clientlibs/'));

    console.log ("copy:static => copy all content.xml");
    return gulp.src(conf.projectPath + 'static/**/.content.xml')
        .pipe(gulp.dest(conf.projectPath + 'clientlibs/'));
});


/**********************************************************************************************************************
 * COPY STATIC                                                                                                   END
 *********************************************************************************************************************/



/**********************************************************************************************************************
 * JS                                                                                                           BEGIN
 *********************************************************************************************************************/

// FILE TASK to delete dead file
gulp.task('del:js', function () {
    return del([
        conf.projectPath + 'clientlibs/publish/scripts/coverComponent.js',
        conf.projectPath + 'clientlibs/publish/scripts/ajaxcaller.js',
        conf.projectPath + 'clientlibs/publish/scripts/btq-apt.js',
        conf.projectPath + 'clientlibs/publish/scripts/handlebars.js',
        conf.projectPath + 'clientlibs/publish/scripts/jwplayer.html5.js',
        conf.projectPath + 'clientlibs/publish/scripts/jquery-extra-selectors.js',
        conf.projectPath + 'clientlibs/publish/scripts/jwplayer.js',
        conf.projectPath + 'clientlibs/publish/scripts/latestCreationsComponent.js',
        conf.projectPath + 'clientlibs/publish/scripts/maps-find-boutique.js',
        conf.projectPath + 'clientlibs/publish/scripts/nss.js',
        conf.projectPath + 'clientlibs/publish/scripts/maps.js',
        conf.projectPath + 'clientlibs/publish/scripts/perlee_xmas16/animation-collection.js',
        conf.projectPath + 'clientlibs/publish/scripts/perlee_xmas16/animation-home.js',
        conf.projectPath + 'clientlibs/publish/scripts/selectivizr.js',
        conf.projectPath + 'clientlibs/publish/scripts/vca.callback.js',
        conf.projectPath + 'clientlibs/publish/scripts/storelocator.js',
        conf.projectPath + 'clientlibs/publish/scripts/modernizr-1.7.min.js',
        conf.projectPath + 'clientlibs/publish/scripts/CTAband.js'
    ]);
});

// FILE TASK : copy JS files to clientLib
gulp.task('copy:js', function () {
    var comment = '/* \n'+
        ' * Copyright Van Cleef and Arpels by Valtech_\n' +
        ' * Last modified : ' + getDate() + '\n' +
        ' */\n\n';

    return gulp.src(conf.projectPath + 'src/js/**/*.js')
        .pipe (banner(comment))
        .pipe(gulp.dest(conf.projectPath + 'clientlibs/'));
});

// FILE TASK : copy JS files to clientLib
gulp.task('copy:concat', function () {
    return gulp.src(_conf.projectPath + 'src/js/publish/00-vendor/*.js')
        .pipe(concat({path:'all.js'}))
        .pipe(gulp.dest(_conf.projectPath + 'clientlibs/publish/scripts/'));
});

// FILE TASK : Write/Rewrite js dir content located in publisj clienlib
gulp.task('copy:write', function () {
    // Empty contents of js.txt file
    fs.writeFile(_conf.projectPath + 'clientlibs/publish/js.txt', '',
        function(){
            console.log('copy:write - js.txt emptied.');
        });

    fs.appendFile(_conf.projectPath + 'clientlibs/publish/js.txt', '#base=scripts\n', function (err) {
        if (err) {
            console.error('copy:files - err : ', err);
        }
    });

    // And store their into the array list
    glob(_conf.projectPath + 'clientlibs/publish/scripts/00-vendor/**/*.js', function(err, files) {

        // Appending files names to clientlib directory js.txt file
        for (var i=0; i<files.length; i++) {
            (function(idx){
                var fileName = files[idx].replace(_conf.projectPath + 'clientlibs/publish/scripts/', '');
                fs.appendFile(_conf.projectPath + 'clientlibs/publish/js.txt', fileName + '\n', function (err) {
                    if (err) {
                        console.error('copy:write - ERROR : ', err);
                    } else {
                        console.log('copy:write - ' + fileName + ' appended.');
                    }
                });
            })(i);
        }
    });

    glob(_conf.projectPath + 'clientlibs/publish/scripts/00-vendor/**/*.js', function(err, files) {

        // Appending files names to clientlib directory js.txt file
        for (var i=0; i<files.length; i++) {
            (function(idx){
                var fileName = files[idx].replace(_conf.projectPath + 'clientlibs/publish/scripts/', '');
                fs.appendFile(_conf.projectPath + 'clientlibs/publish/js.txt', fileName + '\n', function (err) {
                    if (err) {
                        console.error('copy:write - ERROR : ', err);
                    } else {
                        console.log('copy:write - ' + fileName + ' appended.');
                    }
                });
            })(i);
        }
    });

});

gulp.task ('js:watch', function (){
    gulp.watch(conf.projectPath + 'src/js/**/*.js', function (event){
        livereload_path_system	 = event.path.replace(/\\/g, '/');
        if (isdebug()) console.log (livereload_path_system);
        livereload_pathArray = livereload_path_system.split('/');
        livereload_fileName = livereload_pathArray[livereload_pathArray.length - 1];
        livereload_componentPath = livereload_path_system.replace(livereload_path_system.split("/etc/designs/")[0]+'/etc/designs/', '').replace('src/js/','clientlibs/');
        return runSequence('curl-vault','browser-sync:reload');
    });
});

// FILE TASK : Check JavaScript code with jshint
gulp.task('jshint', function() {
    return gulp.src(conf.scripts)
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

/**********************************************************************************************************************
 * JS                                                                                                             END
 *********************************************************************************************************************/


/**********************************************************************************************************************
 * JSP                                                                                                          DEBUG
 *********************************************************************************************************************/

gulp.task ('jsp:watch', function (){
    gulp.watch(conf.projectPathJsp, function (event){
        livereload_path_system	 = event.path.replace(/\\/g, '/');
        if (isdebug()) console.log (livereload_path_system);
        livereload_pathArray = livereload_path_system.split('/');
        livereload_fileName = livereload_pathArray[livereload_pathArray.length - 1];
        livereload_componentPath = livereload_path_system.replace(livereload_path_system.split("/apps/")[0]+'/apps/', '');
        return runSequence('curl-vault:jsp','browser-sync:reload');
    });
});

/**********************************************************************************************************************
 * JSP                                                                                                            END
 *********************************************************************************************************************/


/**********************************************************************************************************************
 * LIVE RELOAD                                                                                                  BEGIN
 *********************************************************************************************************************/

gulp.task('browser-sync', function() {
    browserSync.init({
        proxy: conf.pathInstance+':'+conf.portpublish+'/eu/fr.html',
        watchTask: true,
        debugInfo: true,
        tunnel: false,
        serveStatic: ['.'],
        reloadDelay: 1500
    });
});


gulp.task('browser-sync:reload', function() {
    return browserSync.reload();
});




//CONTINUOUS INTEGRATION TASK : Send to instance
gulp.task('curl-vault', function () {
    if (isAuthor()){
        if (isdebug())console.log ('curl -u admin:admin -s -T ' + livereload_path_system + ' http://' + conf.pathInstance + ':' + conf.port + '/etc/designs/' + livereload_componentPath);
        gulp.src('')
            .pipe(plumber({
                errorHandler: beepError
            }))
            .pipe(shell([
                'curl -u admin:admin -s -T ' + livereload_path_system + ' http://' + conf.pathInstance + ':' + conf.port + '/etc/designs/' + livereload_componentPath
            ]))

            .pipe(notify({
                onLast: true,
                title: 'Curl vault update Author'
            }));
    }
    if (isPublish()){
        if (isdebug())console.log ('Launch Publish replication');
        gulp.src('')
            .pipe(plumber({
                errorHandler: beepError
            }))
            .pipe(shell([
                'curl -u admin:admin  -F '+ 'path="/etc/designs/' + livereload_componentPath+ '" -F cmd="activate" http://'+ conf.pathInstance + ':' + conf.port +'/bin/replicate.json'
            ]))
            .pipe(notify({
                onLast: true,
                title: 'Curl vault update Publish'
            }));
    }
});

//CONTINUOUS INTEGRATION TASK : Send to instance
gulp.task('curl-vault:jsp', function () {
    if (isAuthor()){
        if (isdebug())console.log ('curl -u admin:admin -s -T ' + livereload_path_system + ' http://' + conf.pathInstance + ':' + conf.port + '/apps/' +livereload_componentPath);
        gulp.src('')
            .pipe(plumber({
                errorHandler: beepError
            }))
            .pipe(shell([
                'curl -u admin:admin -s -T ' + livereload_path_system + ' http://' + conf.pathInstance + ':' + conf.port  + '/apps/' + livereload_componentPath
            ]))

            .pipe(notify({
                onLast: true,
                title: 'Curl vault update Author jsp'
            }));
    }
    if (isPublish()){
        if (isdebug())console.log ('Launch Publish replication');
        gulp.src('')
            .pipe(plumber({
                errorHandler: beepError
            }))
            .pipe(shell([
                'curl -u admin:admin  -F '+ 'path="/apps/' + livereload_componentPath+ '" -F cmd="activate" http://'+ conf.pathInstance + ':' + conf.port +'/bin/replicate.json'
            ]))
            .pipe(notify({
                onLast: true,
                title: 'Curl vault update Publish jsp'
            }));
    }
});


/**********************************************************************************************************************
 * LIVE RELOAD                                                                                                    END
 *********************************************************************************************************************/

/**********************************************************************************************************************
 * SPRITE CREATION TASK - INvest due to an offset problem locally (task should be removed from stack)  BEGIN
 *  *********************************************************************************************************************/
/*
 * @see https://github.com/jkphl/gulp-svg-sprite
 *
 * @see https://github.com/jkphl/svg-sprite
 *
 * @see https://github.com/jkphl/node-iconizr
 *      This version of node-iconizr is still based on an outdated version of svg-sprite.
 *      Links to the svg-sprite manual have been adapted. An updated version of node-iconizr
 *      will be available soon, supporting all the shiny new features.
 *
 * @see https://github.com/jkphl/gulp-iconizr
 *      Same as above for gulp
 *
 * @see http://jkphl.github.io/svg-sprite/#gulp
 *      This configurator lets you create a custom svg-sprite configuration in seconds.
 *      Scroll down to see the result as JSON, Node.js project, Gruntfile or Gulpfile.
 */
gulp.task('sprite:svgSprite', function () {
    return gulp.src(paths_sprites.sprite.src)
        .pipe(plumber())
        .pipe(svgSprite({
                //log: "debug",
                shape: {
                    spacing: {
                        padding: 5
                    }
                },
                mode: {
                    css: {
                        dest: "./",
                        layout: "diagonal",
                        sprite: paths_sprites.sprite.svg,
                        bust: false,
                        render: {
                            scss: {
                                dest: paths_sprites.sprite.css,
                                template: path.resolve(__dirname) + conf.sprite.templateSrcDir + 'sprite-template.scss'
                            }
                        }
                    }
                },
                variables: {
                    mapname: "icons"
                }
            }
        )).on('error', function(error){
            console.error('[Error] sprite:svgSprite - error : ', error);
        })
        .pipe(gulp.dest(basePaths.dest));
});

// SPRITE CREATION TASK
gulp.task('sprite:pngSprite', ['sprite:svgSprite'], function() {
    return gulp.src(basePaths.dest + paths_sprites.sprite.svg)
        .pipe(svg2png())
        .pipe(size({
            showFiles: true
        }))
        .pipe(gulp.dest(paths_sprites.images.dest));
});

// SPRITE CREATION TASK
gulp.task('sprite:watch', ['sprite:delete'], function(){
    gulp.watch(paths_sprites.sprite.src, ['sprite:sprite']).on('change', function(evt) {
        console.log('sprite:sprite - onChange evt : ', evt);
        changeEvent(evt);
    });
    gulp.watch('dev/sass/**/*.scss', ['sprite:styles']).on('change', function(evt) {
        console.log('sprite:styles - onChange evt : ', evt);
        changeEvent(evt);
    });
    gulp.watch('dev/js/**/*.js', ['sprite:script']).on('change', function(evt) {
        console.log('sprite:script - onChange evt : ', evt);
        changeEvent(evt);
    });
});

// SPRITE CREATION TASK
gulp.task('sprite:styles', function() {

    var comment = '/* \n' +
        ' * <%= pkg.name %> <%= pkg.version %>\n' +
        ' * <%= pkg.description %>\n' +
        ' * <%= pkg.homepage %>\n' +
        ' * \n' +
        ' * Copyright 2017, <%= pkg.author %>\n' +
        ' * Last modified : ' + getDate() + '\n' +
        ' */\n\n';

    return gulp.src(basePaths.src + 'sass/build.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer({
            browsers: ['> 1%', 'IE 8', 'IE 9', 'IE 10', 'IE 11']
        }))
        .pipe(banner(comment, {
            pkg: pkg
        }))
        .pipe(gulp.dest(basePaths.dest + 'css'));
});

// SPRITE CREATION TASK - JS
gulp.task('sprite:script', function(){
    var comment = '/* \n' +
        ' * <%= pkg.name %> <%= pkg.version %>\n' +
        ' * <%= pkg.description %>\n' +
        ' * <%= pkg.homepage %>\n' +
        ' * \n' +
        ' * Copyright 2017, <%= pkg.author %>\n' +
        ' * Last modified : ' + getDate() + '\n' +
        ' */\n\n';

    return gulp.src(basePaths.src + 'js/**/*.js')
        .pipe(uglify())
        .pipe(concat('vcaFront.js'))
        .pipe(banner(comment, {
            pkg: pkg
        }))
        .pipe(gulp.dest(basePaths.dest + 'js'));
});

// SPRITE CREATION TASK
gulp.task('sprite:delete', function(){
    del([basePaths.dest + 'src/']);
});

/**
 * SPRITE CREATION TASK
 * --------------------
 * Place the CSS built file in the proper directory
 *
 * 1. Deletes old vca-sprite CSS file
 * 2. Removes :not pseudo class from ie selector
 * 3. Add display inline-block property to the ie class
 * 4. Changes the image path
 * 5. Rename the build CSS file to vca-sprite before copying it
 *
 */
gulp.task('sprite:copy', function(){
    var idx = 0;

    del([path.resolve(__dirname) + conf.sprite.cssDestDir + 'vca-sprite.css']);

    return gulp.src(path.resolve(__dirname) + conf.sprite.cssSrcDir + 'build.css')
        .pipe(replace(/:not\(\.extended\)/gmi, function (match, p1, p2, p3, offset, string) {
            idx++;
            // removes only second and fourth string instance
            return idx === 2 || idx === 4 ? '' : match.toString();
        }))
        .pipe(replace(/background-image: url\("\.\.\/img\/sprite\.png"\);/gmi, function () {
            // removes only second and fourth string instance
            return 'background-image: url("../img/sprite.png"); display: inline-block;';
        }))
        .pipe(replace('../img', conf.sprite.spriteDestDirString))
        .pipe(rename('vca-sprite.css'))
        .pipe(gulp.dest(path.resolve(__dirname) + conf.sprite.cssDestDir));
});

// SPRITE CREATION TASK - Place both of the sprite files in the proper directory
gulp.task('sprite:imagecopy', function(){
    del([
        path.resolve(__dirname) + conf.sprite.spriteDestDir + 'sprite.png',
        path.resolve(__dirname) + conf.sprite.spriteDestDir + 'sprite.svg'
    ]);

    return gulp.src(basePaths.dest + 'img/*')
        .pipe(gulp.dest(path.resolve(__dirname) + conf.sprite.spriteDestDir));
});
/**********************************************************************************************************************
 * SPRITE CREATION TASK                                                                                           END
 **********************************************************************************************************************/




/**********************************************************************************************************************
 * TEST UNIT                                                                                                     BEGIN
 *********************************************************************************************************************/

// CONTINUOUS INTEGRATION TASK : Jasmine test server. Check results on http://localhost:8888/
gulp.task('jasmine', function() {
    return gulp.src(conf.jasmine)
        .pipe(jasminebrowser.specRunner())
        .pipe(jasminebrowser.server({port: 8888}));
});


gulp.task('verify:yum', function () {
    gulp.src('./src/test.js')
        .pipe(compress({
            type: 'js'
        }))
        .pipe(gulp.dest('./dest'));
});
/**********************************************************************************************************************
 * TEST UNIT                                                                                                       END
 *********************************************************************************************************************/



// DOCUMENTATION CREATION TASK : JS Docs
gulp.task('jsdoc', function(cb) {
    gulp.src(conf.projectPath, {read: false})
        .pipe(jsdoc(jsDocConfig, cb));
});




/**********************************************************************************************************************
 * MULTIPLE TASK
 *********************************************************************************************************************/

gulp.task('sprite:sprite', function(){runSequence('sprite:pngSprite', 'sprite:styles', 'sprite:delete', 'sprite:copy', 'sprite:imagecopy')});
gulp.task('sprite', function(){runSequence('sprite:sprite','sprite:watch')});
gulp.task('bower:all', function(){runSequence('copy:bower')});
gulp.task('copy:all', function(){runSequence('copy:static', 'copy:js', 'del:js')});//'copy:write'
gulp.task('test', function(){runSequence('jshint','csslint')});
gulp.task('styles:all', function(){runSequence('sass')});
gulp.task('connect', function(){runSequence('sass:watch', 'js:watch','jsp:watch' , 'browser-sync')});
gulp.task('serve', function(){runSequence('install','connect')});
gulp.task('install', function(){runSequence('bower:all','copy:all', 'styles:all')}); //'sprite:sprite'
gulp.task('default', function(){runSequence('install')});