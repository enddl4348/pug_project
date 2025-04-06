const UI = {};

UI.throttle = function (func, limit) {
    let lastFunc;
    let lastRan;

    return function () {
        const context = this;
        const args = arguments;

        if (!lastRan) {
            func.apply(context, args);
            lastRan = Date.now();
        } else {
            clearTimeout(lastFunc);
            lastFunc = setTimeout(function () {
                if (Date.now() - lastRan >= limit) {
                    func.apply(context, args);
                    lastRan = Date.now();
                }
            }, limit - (Date.now() - lastRan));
        }
    };
};

UI.tab = (function ($) {
    const $tabs = $('[data-js="tab"]');
    const $header = $('[data-js="header"]');
    const headerHeight = $('[data-js="header"]').height();
    const $subIntroHeight = $('.sub sub-intro').height();
    const $tabButtons = $('[data-js="tabButtons"]');
    const $stickyScrollButton = $('[data-js="scrollButtonWrap"]');

    const CLASSNAME = 'is-active';

    return {
        init() {
            $tabs.each((index, tab) => {
                const $tab = $(tab);
                const $tabButton = $tab.find('[data-js="tabButton"]');
                const $tabContents = $tab.find('[data-js="tabContent"]');

                this.bindEvents($tabButton, $tabContents);

                // 초기 활성화 상태 설정 (옵션)
                this.activateTab(0, $tabButton, $tabContents);
            });
        },
        bindEvents($tabButton, $tabContents) {
            const self = this;
            $tabButton.on('click', function (e) {
                e.preventDefault();
                const activeIndex = $(e.currentTarget).index();
                self.activateTab(activeIndex, $tabButton, $tabContents);

                if ($stickyScrollButton.hasClass('sticky')) {
                    $stickyScrollButton.removeClass('sticky');
                }
                // 클릭한 탭 버튼의 위치로 스크롤 이동
                $(window).scrollTop(headerHeight + $subIntroHeight);
            });
        },
        // tab active
        activateTab(index, tabButtons, tabContents) {
            this.toggleAction(tabButtons, index);
            this.toggleAction(tabContents, index);
        },
        // toggle
        toggleAction(elements, index) {
            elements.removeClass(CLASSNAME);
            elements.eq(index).addClass(CLASSNAME);
        },
        // 외부에서 탭 활성화
        clickTab(index, tab) {
            //UI.tab.clickTab(0, '.tab')
            const $tab = $(tab);
            const $tabButton = $tab.find('[data-js="tabButton"]');
            const $tabContents = $tab.find('[data-js="tabContent"]');

            if (index < 0 || index >= $tabButton.length) {
                return;
            }

            this.activateTab(index, $tabButton, $tabContents);
        },
    };
})(jQuery);

// gnb
UI.gnb = (function ($) {
    const $gnbButton = $('[data-js="gnbButton"]');
    const $header = $('[data-js="header"]');
    const $gnbList = $('.all-gnb__category');
    const $body = $('body');
    const CLASSNAME = 'is-open';

    return {
        init() {
            this.bindEvents();
        },
        bindEvents() {
            $gnbButton.on('click', (e) => {
                this.toggle($header);
            });
        },
        toggle($target) {
            if ($target.hasClass(CLASSNAME)) {
                this.close($target);
            } else {
                this.open($target);
            }
        },
        open($target) {
            $target.addClass(CLASSNAME);
            $body.css('overflow', 'hidden');
            $gnbList.scrollTop(0);
        },
        close($target) {
            $target.removeClass(CLASSNAME);
            $body.css('overflow', 'visible');
        },
    };
})(jQuery);

// globalButton
UI.globalLayer = (function ($) {
    const $globalLayer = $('[data-js="globalLayer"]');
    const $globalButton = $globalLayer.find('[data-js="globalButton"]');
    const $globalLink = $globalLayer.find('[data-js="globalLink"]');
    const $body = $('body');
    const CLASSNAME = 'is-open';

    return {
        init() {
            this.bindEvents();
        },
        bindEvents() {
            $globalButton.on('click', (e) => {
                this.open($globalLayer);
            });
            $body.on('click', (e) => {
                const target = e.target;
                if (!$(target).is($globalButton)) {
                    //target이 아닐때만 close
                    this.close($globalLayer);
                }
            });
            $(window).on('scroll', (e) => {
                this.close($globalLayer);
            });
        },
        open($target) {
            $target.addClass(CLASSNAME);
        },
        close($target) {
            $target.removeClass(CLASSNAME);
        },
    };
})(jQuery);

UI.scrollEvent = (function ($) {
    const $scrollButton = $('[data-js="scrollButton"]');
    const $scrollSection = $('[data-js="scrollSection"]');
    const $scrollButtons = $('[data-js="scrollButtonWrap"]');
    const $scrollButtonBox = $('[data-js="scrollButtonBox"]'); //scroll되는 element
    const $tabButtons = $('[data-js="tabButtons"]');
    const $header = $('[data-js="header"]');

    const CLASSNAME = 'is-active';
    const STICKY = 'sticky';
    const HIDDEN = 'hidden';
    const activeIndex = 0;
    let isScrolling = false; // 스크롤 상태
    let resizeTimeout;

    return {
        init() {
            this.bindEvents();
            // 초기 tabOffsetTop 값을 설정
            this.updateScrollBarOffsetTop();
        },
        bindEvents() {
            const self = this;

            // 1. button scroll move, active 클래스 추가
            $scrollButton.on('click', function (e) {
                e.preventDefault();
                const index = $(this).index();
                const target = $scrollSection.eq(index);
                isScrolling = true; // 스크롤 중 상태로 설정

                $scrollButton.removeClass(CLASSNAME);
                $(this).addClass(CLASSNAME);

                $('html, body').animate(
                    {
                        scrollTop:
                            target.offset().top -
                            self.tabButtonsHeight -
                            self.scrollBarHeight -
                            self.sectionPaddingBottom,
                    },
                    400,
                    function () {
                        // 스크롤 애니메이션이 끝난 후에야 스크롤 이벤트 다시 허용
                        setTimeout(function () {
                            // history sticky
                            self.historySticky();
                            // tab sticky
                            self.tabSticky();
                            isScrolling = false;
                        }, 100); // 약간의 딜레이 추가하여 스크롤 처리 완료 후 스크롤 이벤트가 발생하도록 설정
                    },
                );

                self.scrollToActiveButton($(this));
            });

            // 2.button sticky, 스크롤 스파이
            $(window).on(
                'scroll',
                UI.throttle(function () {
                    if (isScrolling) return;

                    const scrollTop = $(this).scrollTop();

                    // history sticky
                    self.historySticky(scrollTop);
                    // tab sticky
                    self.tabSticky(scrollTop);

                    $scrollSection.each(function () {
                        let activeButton;
                        self.scrollBarHeight = $scrollButtons.outerHeight();

                        const top =
                            $(this).offset().top -
                            self.tabButtonsHeight +
                            -self.scrollBarHeight -
                            self.sectionPaddingBottom;

                        const bottom = top + $(this).outerHeight();

                        if (scrollTop >= top && scrollTop <= bottom) {
                            let index = $scrollSection.index($(this));

                            // console.log(`${index} 섹션에 들어옴!`);

                            // 스크롤 중일 때는 active 상태 변경하지 않음
                            if (!isScrolling) {
                                $scrollButton.removeClass(CLASSNAME);
                                activeButton = $scrollButton
                                    .eq(index)
                                    .addClass(CLASSNAME);
                            }

                            // 버튼이 가려져 있을 경우 스크롤 이동 (부모 요소의 scrollLeft 값 조정)
                            self.scrollToActiveButton(activeButton);
                        }
                    });
                }, 200),
            ); // 100ms마다 실행

            $(window).on('resize', function () {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(function () {
                    self.updateScrollBarOffsetTop();
                }, 200); // 리사이즈가 끝난 후
            });
        },
        // history sticky func
        historySticky(scrollTop = $(window).scrollTop()) {
            const self = this;

            $scrollButtons.length
                ? (self.scrollBarOffsetTop = $scrollButtons.offset().top)
                : 0;
            if (scrollTop >= self.scrollBarOffsetTop - self.tabButtonsHeight) {
                $scrollButtons.addClass(STICKY);
            } else {
                $scrollButtons.removeClass(STICKY);
            }
        },
        // tab sticky func
        tabSticky(scrollTop = $(window).scrollTop()) {
            const self = this;

            if (scrollTop >= self.tabOffsetTop) {
                $header.addClass(HIDDEN);
            } else {
                $header.removeClass(HIDDEN);
            }
        },
        // ScrollBarOffsetTop 업데이트 함수
        updateScrollBarOffsetTop() {
            const self = this;

            $tabButtons.length
                ? (self.tabOffsetTop = $tabButtons.offset().top)
                : 0;
            self.tabButtonsHeight = $tabButtons.outerHeight() || 0;
            self.scrollBarHeight = $scrollButtons.outerHeight() || 0;
            self.paddingLeftValue =
                parseInt($scrollButtonBox.css('padding-left'), 10) || 0;
            self.sectionPaddingBottom =
                parseInt(
                    $('.history__content-desc').css('padding-bottom'),
                    10,
                ) || 0;
        },
        //active button center align
        scrollToActiveButton(activeButton) {
            const buttonPosition = activeButton.position().left;
            const buttonWidth = activeButton.outerWidth();
            const containerWidth = $scrollButtonBox.outerWidth();
            const containerScrollLeft = $scrollButtonBox.scrollLeft();

            const buttonCenter = buttonPosition + buttonWidth / 2; // 버튼의 중앙 위치
            const containerCenter = containerWidth / 2; // 컨테이너의 중앙 위치

            // console.log(buttonPosition, buttonWidth);
            const newScrollLeft =
                containerScrollLeft + (buttonCenter - containerCenter);

            // 중복 애니메이션 방지
            if (newScrollLeft !== containerScrollLeft) {
                $scrollButtonBox
                    .stop()
                    .animate({ scrollLeft: newScrollLeft }, 100);
            }
        },
    };
})(jQuery);

// sizeAnimation - mo:click, pc: hover
UI.activeAnimation = (function ($) {
    const $element = $('[data-js="sizeAnimation"]');
    const CLASSNAME = 'is-active';
    let isMobile = window.matchMedia('(max-width: 1439px)').matches; // 모바일 여부 판단

    return {
        init() {
            $element.last().addClass(CLASSNAME);
            this.bindEvents();
            this.bindResizeEvent();
        },
        bindEvents() {
            if (isMobile) {
                $element.off('mouseenter mouseleave');
                // 모바일에서의 클릭 이벤트
                $element.on('click', (e) => {
                    const $target = $(e.target).closest($element);
                    const $siblings = $target.siblings($element);
                    this.addClass($target, CLASSNAME);
                    this.removeClass($siblings, CLASSNAME);
                });
            } else {
                // PC에서의 hover 이벤트
                $element.off('click');
                $element.last().css('width', '44%');

                $element.on('mouseenter', (e) => {
                    const $target = $(e.target).closest($element);
                    const $siblings = $target.siblings($element);

                    $target.stop(true).animate({ width: '44%' }, 600);
                    $siblings.stop(true).animate({ width: '17%' }, 600);

                    this.addClass($target, CLASSNAME);
                    this.removeClass($siblings, CLASSNAME);
                });

                $element.on('mouseleave', (e) => {
                    const $target = $(e.target).closest($element);
                    const $siblings = $target.siblings($element);

                    $target.stop(true).animate({ width: '44%' }, 600);
                    $siblings.stop(true).animate({ width: '17%' }, 600);

                    this.addClass($target, CLASSNAME);
                    this.removeClass($siblings, CLASSNAME);
                });
            }
        },
        bindResizeEvent() {
            $(window).on('resize', () => {
                const newIsMobile = window.matchMedia(
                    '(max-width: 1439px)',
                ).matches;

                if (newIsMobile !== isMobile) {
                    isMobile = newIsMobile;

                    if (isMobile) {
                        $element.off('mouseenter mouseleave');
                        $element.css('width', '100%');
                    } else {
                        $element.off('click');
                        $element.last().css('width', '44%');
                    }

                    this.bindEvents();
                }
            });
        },
        addClass($element, className) {
            if (!$element.hasClass(className)) {
                $element.addClass(className);
            }
        },
        removeClass($element, className) {
            if ($element.hasClass(className)) {
                $element.removeClass(className);
            }
        },
    };
})(jQuery);

// alert popup
UI.alertPopup = (function ($) {
    const $popupButton = $('[data-js="popupButton"]');
    const $popupClose = $('[data-js="popupClose"]');
    const $popupDim = $('[data-js="popupDim"]');
    const ACTIVECLASS = 'is-open';
    let isMobile = window.matchMedia('(max-width: 1439px)').matches; // is mobile?
    let $targetPopup;

    return {
        init() {
            this.bindEvents();
            this.handleResize(); //resize
        },
        bindEvents() {
            const self = this;

            if (isMobile) {
                //open
                $popupButton.on('click', function () {
                    if (isMobile) {
                        const popupId = $(this).data('href');
                        $targetPopup = $('#' + popupId);
                        self.addClass($targetPopup, ACTIVECLASS);
                    }
                });

                //close
                $popupClose.on('click', function () {
                    self.removeClass($targetPopup, ACTIVECLASS);
                });

                $popupDim.on('click', function () {
                    self.removeClass($targetPopup, ACTIVECLASS);
                });
            }
        },
        handleResize() {
            const self = this;

            $(window).on('resize', function () {
                isMobile = window.matchMedia('(max-width: 1439px)').matches;

                if (!isMobile) {
                    self.removeClass($targetPopup, ACTIVECLASS);
                    $targetPopup = null; // 팝업 타겟 초기화
                } else {
                    self.bindEvents();
                }
            });
        },
        addClass($element, className) {
            if ($element && !$element.hasClass(className)) {
                $element.addClass(className);
            }
        },
        removeClass($element, className) {
            if ($element && $element.hasClass(className)) {
                $element.removeClass(className);
            }
        },
        open(popupId) {
            //ex: UI.alertPopup.open('info-01');
            //외부에서 사용할 method
            if (isMobile) {
                $targetPopup = $('#' + popupId);
                this.addClass($targetPopup, ACTIVECLASS);
            }
        },
        close() {
            //외부에서 사용할 method
            if ($targetPopup) {
                this.removeClass($targetPopup, ACTIVECLASS);
                $targetPopup = null;
            }
        },
    };
})(jQuery);

// accordion
UI.accordion = (function ($) {
    const $accordionButton = $('[data-js="accordionButton"]');
    const CLASSNAME = 'is-open';

    return {
        init() {
            this.bindEvents();
        },
        bindEvents() {
            const self = this;
            $accordionButton.off('click').on('click', function (e) {
                const $target = $(this).closest('[data-js="accordionItem"]');
                const $targetContent = $target.children(
                    '[data-js="accordionContent"]',
                );
                const $siblings = $target.siblings();

                if (!$target.hasClass(CLASSNAME)) {
                    self.addClass($target);
                    $targetContent.slideDown(300);
                    // self.removeClass($siblings); // siblings 클래스 제거
                    // $siblings
                    //     .children('[data-js="accordionContent"]')
                    //     .slideUp(300); // siblings 콘텐츠 닫기
                } else {
                    self.removeClass($target);
                    $targetContent.slideUp(300);
                }
            });
        },
        addClass($target) {
            $target.addClass(CLASSNAME);
        },
        removeClass($target) {
            $target.removeClass(CLASSNAME);
        },
    };
})(jQuery);

UI.formAlert = (function ($) {
    const $popup = $('[data-popup="formAlertPopup"]'); // 팝업을 여는 엘리먼트
    const ACTIVECLASS = 'is-open';

    return {
        init() {
            this.bindEvents();
            // console.log($popup);
        },
        bindEvents() {
            $('[data-popup-open]').on('click', (e) => {
                e.preventDefault();
                const popupId = $(e.currentTarget).data('popup-open');
                this.open(popupId);
            });

            $('[data-popup-close]').on('click', (e) => {
                const popupId = $(e.currentTarget).data('popup-close');
                this.close(popupId);
            });
        },
        open(popupId) {
            //UI.formAlert.open('팝업 id')
            const $targetPopup = $('#' + popupId);
            if ($targetPopup.length && !$targetPopup.hasClass(ACTIVECLASS)) {
                $targetPopup.addClass(ACTIVECLASS);
            }
        },
        close(popupId) {
            //UI.formAlert.close('팝업 id')
            const $targetPopup = $('#' + popupId);
            if ($targetPopup.length && $targetPopup.hasClass(ACTIVECLASS)) {
                $targetPopup.removeClass(ACTIVECLASS);
            }
        },
    };
})(jQuery);

// init
UI.tab.init();
UI.gnb.init();
UI.globalLayer.init();
UI.scrollEvent.init();
UI.activeAnimation.init();
UI.alertPopup.init();
UI.accordion.init();
UI.formAlert.init();
