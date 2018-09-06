
const path = require("path");
const gulp = require('gulp');
const clean = require("gulp-clean");
const yargs = require("yargs");
const {execSync, exec} = require('child_process');
const rename = require('gulp-rename');
const sass = require('gulp-sass');
const tslint = require('gulp-tslint');

const args =  yargs.argv;

const distFolder = 'dist';

gulp.task('clean', () => {
    return gulp.src([distFolder, '*.vsix'])
        .pipe(clean());
});

gulp.task('tslint', () => {
    return gulp.src(["scripts/**/*ts", "scripts/**/*tsx"])
        .pipe(tslint({
            formatter: "verbose",
            fix: true,
        }))
        .pipe(tslint.report());
});
gulp.task('styles', ['clean', 'tslint'], () => {
    return gulp.src("styles/**/*scss")
        .pipe(sass())
        .pipe(gulp.dest(distFolder));
});

gulp.task('build', ['styles'], () => {
    execSync(`webpack`, {
        stdio: [null, process.stdout, process.stderr]
    });
    // return webpack(require('./webpack.config.js'));
});


gulp.task('copy', ['build'], () => {
    gulp.src('node_modules/vss-web-extension-sdk/lib/VSS.SDK.min.js')
        .pipe(gulp.dest(distFolder));
});

gulp.task('package', ['copy'], () => {
    const overrides = {}
    if (yargs.argv.release) {
        overrides.public = true;
    } else {
        const manifest = require('./vss-extension.json');
        overrides.name = manifest.name + ": Development Edition";
        overrides.id = manifest.id + "-dev";
    }
    const overridesArg = `--override "${JSON.stringify(overrides).replace(/"/g, '\\"')}"`;
    const manifestsArg = `--manifests vss-extension.json`;

    exec(`tfx extension create ${overridesArg} ${manifestsArg} --rev-version`,
        (err, stdout, stderr) => {
            if (err) {
                console.log(err);
            }

            console.log(stdout);
            console.log(stderr);
            
        });

});

gulp.task('default', ['package']);
