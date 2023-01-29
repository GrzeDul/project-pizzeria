import { select, templates, settings, classNames } from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';
class Booking {
  constructor(element) {
    const thisBooking = this;
    thisBooking.selectedTable = null;
    thisBooking.starters = [];
    thisBooking.render(element);
    thisBooking.initWidgets();
    thisBooking.getData();
  }

  render(element) {
    const thisBooking = this;
    const generatedHTML = templates.bookingWidget();
    thisBooking.dom = {};
    thisBooking.dom.wrapper = element;
    thisBooking.dom.wrapper.innerHTML = generatedHTML;
    thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(
      select.booking.peopleAmount
    );
    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(
      select.booking.hoursAmount
    );
    thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(
      select.widgets.datePicker.wrapper
    );
    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(
      select.widgets.hourPicker.wrapper
    );
    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(
      select.booking.tables
    );
    thisBooking.dom.floor = thisBooking.dom.wrapper.querySelector(
      select.booking.floor
    );
    thisBooking.dom.phone = thisBooking.dom.wrapper.querySelector(
      select.cart.phone
    );
    thisBooking.dom.address = thisBooking.dom.wrapper.querySelector(
      select.cart.address
    );
    thisBooking.dom.starters = thisBooking.dom.wrapper.querySelector(
      select.booking.starters
    );
    thisBooking.dom.timePickerWrapper = thisBooking.dom.wrapper.querySelector(
      select.booking.timePicker
    );
    thisBooking.dom.submitButton = thisBooking.dom.wrapper.querySelector(
      select.booking.submitButton
    );
  }

  initWidgets() {
    const thisBooking = this;
    thisBooking.peopleAmountWidget = new AmountWidget(
      thisBooking.dom.peopleAmount
    );
    thisBooking.hoursAmountWidget = new AmountWidget(
      thisBooking.dom.hoursAmount
    );
    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);
    thisBooking.dom.peopleAmount.addEventListener('update', function () {});
    thisBooking.dom.hoursAmount.addEventListener('update', function () {});

    thisBooking.dom.timePickerWrapper.addEventListener('updated', function () {
      thisBooking.updateDOM();
      for (const table of thisBooking.dom.tables) {
        table.classList.remove(classNames.booking.tableSelected);
      }
    });

    thisBooking.dom.floor.addEventListener('click', function (event) {
      thisBooking.initTables(event.target);
    });
    thisBooking.dom.starters.addEventListener('click', function (event) {
      if (event.target.name === 'starter') {
        if (
          event.target.checked === true &&
          !thisBooking.starters.includes(event.target.value)
        ) {
          thisBooking.starters.push(event.target.value);
        } else {
          const index = thisBooking.starters.indexOf(event.target.value);
          thisBooking.starters.splice(index, 1);
        }
      }
    });
    thisBooking.dom.submitButton.addEventListener('click', function (event) {
      event.preventDefault();
      thisBooking.sendBooking();
    });
  }

  getData() {
    const thisBooking = this;

    const startDateParam =
      settings.db.dateStartParamKey +
      '=' +
      utils.dateToStr(thisBooking.datePicker.minDate);
    const endDateParam =
      settings.db.dateEndParamKey +
      '=' +
      utils.dateToStr(thisBooking.datePicker.maxDate);

    const params = {
      bookings: [startDateParam, endDateParam],
      eventsCurrent: [settings.db.notRepeatParam, startDateParam, endDateParam],
      eventsRepeat: [settings.db.repeatParam, endDateParam],
    };
    const urls = {
      bookings:
        settings.db.url +
        '/' +
        settings.db.booking +
        '?' +
        params.bookings.join('&'),
      eventsCurrent:
        settings.db.url +
        '/' +
        settings.db.event +
        '?' +
        params.eventsCurrent.join('&'),
      eventsRepeat:
        settings.db.url +
        '/' +
        settings.db.event +
        '?' +
        params.eventsRepeat.join('&'),
    };

    Promise.all([
      fetch(urls.bookings),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function (allResponses) {
        const responseBookings = allResponses[0];
        const responseCurrentEvents = allResponses[1];
        const responseRepeatEvents = allResponses[2];
        return Promise.all([
          responseBookings.json(),
          responseCurrentEvents.json(),
          responseRepeatEvents.json(),
        ]);
      })
      .then(function ([bookings, eventsCurrent, eventsRepeat]) {
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      })
      .catch(function (error) {
        console.error('Error with fetching data: ', error);
      });
  }

  parseData(bookings, eventsCurrent, eventsRepeat) {
    const thisBooking = this;

    thisBooking.booked = {};

    for (let item of bookings) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    for (let item of eventsCurrent) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;

    for (let item of eventsRepeat) {
      if (item.repeat == 'daily') {
        for (
          let loopDate = minDate;
          loopDate <= maxDate;
          loopDate = utils.addDays(loopDate, 1)
        ) {
          thisBooking.makeBooked(
            utils.dateToStr(loopDate),
            item.hour,
            item.duration,
            item.table
          );
        }
      }
    }
    thisBooking.updateDOM();
  }

  makeBooked(date, hour, duration, table) {
    const thisBooking = this;
    if (typeof thisBooking.booked[date] == 'undefined') {
      thisBooking.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);
    for (
      let hourBlock = startHour;
      hourBlock < startHour + duration;
      hourBlock += 0.5
    ) {
      if (typeof thisBooking.booked[date][hourBlock] == 'undefined') {
        thisBooking.booked[date][hourBlock] = [];
      }

      thisBooking.booked[date][hourBlock].push(table);
    }
  }

  updateDOM() {
    const thisBooking = this;

    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    let allAvailable = false;

    if (
      typeof thisBooking.booked[thisBooking.date] == 'undefined' ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] ==
        'undefined'
    ) {
      allAvailable = true;
    }

    for (let table of thisBooking.dom.tables) {
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if (!isNaN(tableId)) {
        tableId = parseInt(tableId);
      }

      if (
        !allAvailable &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
      ) {
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
    }
  }

  initTables(selectedElement) {
    const thisBooking = this;
    // check if clicked element is a table that have attribute with id value
    const tableId = selectedElement.getAttribute(
      settings.booking.tableIdAttribute
    );
    if (
      tableId &&
      !selectedElement.classList.contains(classNames.booking.tableBooked)
    ) {
      thisBooking.selectedTable = tableId;
      // check if selected table have class selected
      if (
        selectedElement.classList.contains(classNames.booking.tableSelected)
      ) {
        selectedElement.classList.remove(classNames.booking.tableSelected);
      } else {
        selectedElement.classList.add(classNames.booking.tableSelected);
      }
      // delete class selected from other tables
      for (const table of thisBooking.dom.tables) {
        if (table.getAttribute(settings.booking.tableIdAttribute) != tableId) {
          table.classList.remove(classNames.booking.tableSelected);
        }
      }
    }
  }

  sendBooking() {
    const thisBooking = this;
    const url = settings.db.url + '/' + settings.db.booking;
    const payload = {
      date: thisBooking.datePicker.value,
      hour: thisBooking.hourPicker.value,
      table: parseInt(thisBooking.selectedTable),
      duration: thisBooking.hoursAmountWidget.value,
      ppl: thisBooking.peopleAmountWidget.value,
      starters: thisBooking.starters,
      phone: thisBooking.dom.phone.value,
      address: thisBooking.dom.address.value,
    };
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };
    const timeout = setTimeout(function () {
      thisBooking.dom.submitButton.textContent = 'Book table';
      thisBooking.dom.submitButton.disabled = false;
    }, 2000);
    fetch(url, options).then(function (res) {
      if (res.ok) {
        thisBooking.dom.submitButton.textContent = 'Sent';
        thisBooking.dom.submitButton.disabled = true;
        timeout;
      } else {
        thisBooking.dom.submitButton.textContent = 'Error';
        thisBooking.dom.submitButton.disabled = true;
        timeout;
      }
    });
    thisBooking.makeBooked(
      payload.date,
      payload.hour,
      payload.duration,
      payload.table
    );
  }
}
export default Booking;
