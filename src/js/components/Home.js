import { templates, select, classNames } from '../settings.js';
class Home {
  constructor(element) {
    const thisHome = this;
    thisHome.render(element);
  }

  render(element) {
    const thisHome = this;
    const generatedHTML = templates.homePage();
    thisHome.dom = {};
    thisHome.dom.wrapper = element;
    thisHome.dom.wrapper.innerHTML = generatedHTML;
    thisHome.carouselWrapper = thisHome.dom.wrapper.querySelector(
      select.homePage.carouselWrapper
    );
    thisHome.dom.carouselSlides = thisHome.carouselWrapper.querySelectorAll(
      select.homePage.slides
    );
    thisHome.dom.dotPickerDiv = thisHome.carouselWrapper.querySelector(
      select.homePage.dotPicker
    );
    thisHome.dom.leftArrow = thisHome.carouselWrapper.querySelector(
      select.homePage.leftArrow
    );
    thisHome.dom.rightArrow = thisHome.carouselWrapper.querySelector(
      select.homePage.rightArrow
    );
    thisHome.makeCarousel();
  }

  makeCarousel() {
    const thisHome = this;
    thisHome.intervalTime = 5000;
    thisHome.interval = null;
    thisHome.lastSlideNum = thisHome.dom.carouselSlides.length;
    thisHome.currentID = thisHome.lastSlideNum + 1;
    thisHome.lastID = thisHome.lastSlideNum;

    for (const slide of thisHome.dom.carouselSlides) {
      const dot = document.createElement('div');
      dot.classList.add('dot');
      dot.setAttribute('id', 'dot' + slide.id.split('e')[1]);
      thisHome.dom.dotPickerDiv.appendChild(dot);
    }

    thisHome.initActions();
    thisHome.moveSlide();
  }

  moveSlide() {
    const thisHome = this;

    if (thisHome.currentID > thisHome.lastSlideNum) {
      thisHome.currentID = 1;
      thisHome.setSlides();
      return;
    } else if (thisHome.currentID < 1) {
      thisHome.currentID = thisHome.lastSlideNum;
      thisHome.setSlides();
      return;
    }
    thisHome.setSlides();
  }

  initActions() {
    const thisHome = this;
    thisHome.dom.leftArrow.addEventListener('click', function () {
      thisHome.currentID -= 1;
      thisHome.moveSlide();
    });

    thisHome.dom.rightArrow.addEventListener('click', function () {
      thisHome.currentID += 1;
      thisHome.moveSlide();
    });

    thisHome.dom.dotPickerDiv.addEventListener('click', function (event) {
      if (event.target.classList.contains('dot')) {
        thisHome.currentID = event.target.id.split('t')[1];
        // if (thisHome.currentID === thisHome.lastSlideNum) {
        //   thisHome.lastID = 1;
        // } else if (thisHome.currentID === 1) {
        //   thisHome.lastID = thisHome.lastSlideNum;
        // } else {
        thisHome.moveSlide();
      }
    });
  }

  setSlides() {
    const thisHome = this;
    clearInterval(thisHome.interval);
    const left = 'left';
    const right = 'right';

    const check = function (side) {
      const opposite = side === 'right' ? 'left' : 'right';
      for (const slide of thisHome.dom.carouselSlides) {
        if (slide.id === 'slide' + thisHome.lastID) {
          slide.classList.remove(classNames.homePage.active, opposite);
          slide.classList.add(side);
        } else if (slide.id === 'slide' + thisHome.currentID) {
          slide.classList.remove(left, right);
          slide.classList.add(classNames.homePage.active);
        } else {
          slide.classList.remove(left, right, classNames.homePage.active);
          slide.classList.add(opposite);
        }
      }
    };
    if (thisHome.lastID === 1 && thisHome.currentID === thisHome.lastSlideNum) {
      check(right);
    } else if (
      thisHome.lastID === thisHome.lastSlideNum &&
      thisHome.currentID === 1
    ) {
      check(left);
    } else if (thisHome.currentID > thisHome.lastID) {
      check(left);
    } else if (thisHome.currentID < thisHome.lastID) {
      check(right);
    }

    for (const dot of thisHome.dom.dotPickerDiv.children) {
      dot.classList.toggle(
        classNames.homePage.active,
        dot.id === 'dot' + thisHome.currentID
      );
    }

    thisHome.interval = setInterval(function () {
      thisHome.currentID += 1;
      thisHome.moveSlide();
    }, thisHome.intervalTime);

    thisHome.lastID = thisHome.currentID;
  }
}

export default Home;
