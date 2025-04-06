(function ($) {
    const scrollAnimation = {
        init: function () {
            this.bindEvents();
        },

        bindEvents: function () {
            const self = this;
            $('[data-animation]').each(function (index, element) {
                self.animateElement(index, element);
            });
        },

        animateElement: function (index, element) {
            const animationType = $(element).data('animation');
            let animationOptions = this.getAnimationOptions(element, index);

            switch (animationType) {
                case 'slideInLeft':
                    animationOptions.x = -80;
                    break;
                case 'slideInLeftMulti':
                    animationOptions.x = -80;
                    animationOptions.delay = index * 0.12;
                    break;
                case 'slideInRight':
                    animationOptions.x = 100;
                    break;
                case 'slideUp':
                    animationOptions.y = 100;
                    break;
                case 'slideUpMulti':
                    animationOptions.y = 100;
                    animationOptions.delay = index * 0.08;
                    animationOptions.scrollTrigger.start = 'top 95%';
                    animationOptions.scrollTrigger.end = 'top 70%';
                    break;
                case 'fadeIn':
                    break;
                default:
                    animationOptions.opacity = 1;
                    break;
            }

            gsap.from(element, animationOptions);
        },
        // options
        getAnimationOptions: function (element, index) {
            return {
                scrollTrigger: {
                    trigger: element,
                    start: 'top 80%',
                    end: 'top 50%',
                    toggleActions: 'play none none none',
                },
                opacity: 0,
                duration: 0.6,
                ease: 'power1.out',
            };
        },
    };

    // 초기화 실행
    scrollAnimation.init();
})(jQuery);
