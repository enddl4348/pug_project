import gulp from 'gulp';
const { src, dest, series, watch, parallel, symlink } = gulp;

import browserSync from 'browser-sync';
import fs from 'fs';
import path from 'path';
import gulpIf from 'gulp-if';
import data from 'gulp-data';
import gulpSass from 'gulp-sass';
import * as sass from 'sass';
const sassCompiler = gulpSass(sass);
import sourcemaps from 'gulp-sourcemaps';
import gulpPug from 'gulp-pug';
import { deleteAsync } from 'del';
import plumber from 'gulp-plumber';

const ROOT = './src';
const DIST = './dist';
const langArray = ['en', 'jp', 'vt'];

const PATH = {
    HTML: `${ROOT}/html`,
    PUG: `${ROOT}/pug`,
    CSS: `${ROOT}/css`,
    SCSS: `${ROOT}/scss`,
    JS: `${ROOT}/js`,
    FONT: `${ROOT}/font`,
    IMG: `${ROOT}/img`,
    FILE: `${ROOT}/files`,
    LOCALES: `${ROOT}/locales`,
};

// scss options
const scssOptions = {
    outputStyle: 'expanded',
    indentType: 'space',
    indentWidth: 2,
    sourceComments: true,
};
// Sass
export function compileSass() {
    // console.log('sass 실행!');
    return src(`${PATH.SCSS}/**/*.scss`)
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(sassCompiler.sync(scssOptions).on('error', sassCompiler.logError))
        .pipe(sourcemaps.write('./map'))
        .pipe(gulp.dest(PATH.CSS))
        .pipe(browserSync.reload({ stream: true }));
}

// 언어별 JSON 파일을 로드하는 함수
function getDataForLocale(locale, filename) {
    const filePath = path.join(PATH.LOCALES, locale, `${filename}.json`); // 언어별 폴더에서 파일명으로 JSON 파일 로드
    if (fs.existsSync(filePath)) {
        // JSON 파일이 존재하는지 확인
        try {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch (error) {
            console.error(
                `Error loading JSON file for ${filename} in ${locale}:`,
                error,
            );
            return {}; // 파일이 있더라도 오류가 발생한 경우 빈 객체 반환
        }
    } else {
        // console.warn(`JSON file not found for ${filename} in ${locale}`);
        return null; // 파일이 없으면 null 반환
    }
}

//다국어 지원 : true 일 경우 호출함수
export function pugTask(locale) {
    // console.log('pug is doing build');
    return (
        src(`${PATH.PUG}/*.pug`)
            .pipe(plumber())
            .pipe(
                data((file) => {
                    const filename = path.basename(file.path, '.pug'); // 파일 이름 추출
                    const jsonData = getDataForLocale(locale, filename); // 언어와 파일명에 해당하는 JSON 데이터 로드

                    if (!jsonData) {
                        // JSON 파일이 없으면 작업을 스킵 플래그 추가
                        // console.warn(
                        //     `Skipping Pug file ${filename}.pug due to missing JSON data.`,
                        // );
                        return { skip: true }; // 스킵 플래그를 추가하여 JSON이 없는 경우 명시
                    }

                    return Object.assign(
                        { lang: locale, skip: false },
                        jsonData,
                    ); // JSON이 있는 경우 skip 플래그를 false로 설정하여 Pug에 전달할 데이터
                }),
            )
            .pipe(gulpPug({ pretty: true })) // JSON 데이터가 있는 경우에만 Pug 작업 실행
            // .pipe(htmlbeautify(htmlBeautifyOpts))
            .pipe(
                gulpIf(
                    (file) => {
                        const shouldProcess = file.data && !file.data.skip;
                        // file.data가 존재하고 skip이 false인 경우
                        // console.log(
                        //     `Should process file: ${file.path}, Condition: ${shouldProcess}`,
                        // );
                        return shouldProcess;
                    },
                    dest(`${PATH.HTML}/${locale}`), // JSON 데이터가 있는 경우 경로
                    dest(`${PATH.HTML}`), // JSON 데이터가 없는 경우 경로
                ),
            )
            .pipe(browserSync.reload({ stream: true }))
    );
}

export function pugCompile(done) {
    langArray.map((locale) => pugTask(locale));
    done();
}

// server
export function server(done) {
    // console.log('server task routed!');
    browserSync.init({
        server: {
            baseDir: './src', //프로젝트의 루트 폴더
        },
    });
    done();
}

// html, css clean
export function clean(done) {
    const delFiles = [`${PATH.HTML}/**`, `${PATH.CSS}/**`];
    deleteAsync(delFiles).then(() => {
        done();
    });
}

// dist 폴더 clean
export function distClean(done) {
    const delFiles = [`${DIST}/**`];
    deleteAsync(delFiles).then(() => {
        done();
    });
}

export function reload(done) {
    browserSync.reload();
    done();
}

// dist build
export function fontBuild() {
    return src(`${PATH.FONT}/*`).pipe(dest(`${DIST}/font`));
}

export function imgBuild() {
    return src(`${PATH.IMG}/**/*`).pipe(dest(`${DIST}/img`));
}

export function fileBuild() {
    return src(`${PATH.FILE}/*`).pipe(dest(`${DIST}/files`));
}

export function htmlBuild() {
    return src(`${PATH.HTML}/*.html`).pipe(dest(`${DIST}/html`));
}

export function rootFiles() {
    return src([`${ROOT}/index.html`, `${ROOT}/w_board.json`]).pipe(
        dest(`${DIST}`),
    );
}

export function cssBuild() {
    return src(`${PATH.CSS}/*.css`).pipe(dest(`${DIST}/css`));
}

export function jsBuild() {
    return src(`${PATH.JS}/**`).pipe(dest(`${DIST}/js`));
}

// watching
export function watching() {
    watch([`${PATH.PUG}/**`, `${PATH.LOCALES}/**`], pugCompile);
    watch(`${PATH.SCSS}/**`, compileSass);
    watch(`${PATH.JS}/**`, reload);
}

export const dev = series(
    clean,
    pugCompile,
    compileSass,
    server,
    parallel(watching),
); // 작업용
export const build = series(
    distClean,
    fontBuild,
    imgBuild,
    fileBuild,
    htmlBuild,
    rootFiles,
    cssBuild,
    jsBuild,
); // 빌드용
