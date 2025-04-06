const swiperController = {
    progressSelector:
        '.main-swiper__controler .swiper-pagination-bullet-active .progress-inner',

    getProgressElement: function () {
        return $(this.progressSelector);
    },

    toggleAutoplay: function (mainSwiper) {
        const $playerButton = $('.main-swiper__controler .main-swiper__player');
        let progress = this.getProgressElement(); // 메서드로 progress 선택

        $playerButton.on('click', (event) => {
            progress = this.getProgressElement(); // 슬라이드 변경 시마다 새로 progress 선택
            if ($(event.currentTarget).hasClass('active')) {
                this.play(mainSwiper, progress, event.currentTarget);
            } else {
                this.pause(mainSwiper, progress, event.currentTarget);
            }
        });
    },

    play: function (mainSwiper, progress, button) {
        $(button).removeClass('active');
        progress.css({ 'animation-play-state': 'running' });
        mainSwiper.autoplay.start();
    },

    pause: function (mainSwiper, progress, button) {
        $(button).addClass('active');
        progress.css({ 'animation-play-state': 'paused' });
        mainSwiper.autoplay.stop();
    },

    resetProgressBar: function () {
        const progress = this.getProgressElement();
        progress.css({ 'animation-play-state': 'running' });
    },
};

// Swiper 인스턴스 생성 및 설정
const mainVisual = new Swiper('.main-swiper', {
    slidesPerView: 1,
    spaceBetween: 0,
    autoplay: {
        delay: 7000,
        disableOnInteraction: false,
    },
    pagination: {
        el: '.main-swiper__pagination',
        clickable: true,
        renderBullet: function (index, className) {
            return (
                '<span class="' +
                className +
                '">' +
                '0' +
                (index + 1) +
                "<span class='progress-bar'><span class='progress-inner'></span></span></span>"
            );
        },
    },
    on: {
        init: function () {
            swiperController.resetProgressBar(); // 초기화 시 progress bar 설정
        },
        slideChange: function () {
            swiperController.resetProgressBar(); // 슬라이드 변경 시 progress bar 설정
        },
    },
});

// Autoplay 컨트롤러 초기화
swiperController.toggleAutoplay(mainVisual);
