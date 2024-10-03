function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Calendar Events')
    .addItem('Load Events', 'openSidebar')
    .addSeparator()
    .addItem('Send my calendar invite', 'sendCalendarInvite' )
    .addToUi();
}


function openSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('Sidebar')
      .setTitle('Select Calendar');
  SpreadsheetApp.getUi().showSidebar(html);
}

function getCalendars() {
  var calendars = CalendarApp.getAllCalendars();
  var calendarList = calendars.map(function(calendar) {
    return {
      id: calendar.getId(),
      name: calendar.getName()
    };
  });
  return calendarList;
}

function getEvents(calendarId) {
  try {
    var calendar = CalendarApp.getCalendarById(calendarId);
    if (!calendar) {
      return []; // Return an empty array if the calendar is not found
    }
    
    var startDate = new Date();
    var endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 2);
    
    var events = calendar.getEvents(startDate, endDate);
    
    var eventList = events.map(function(event) {
      return {
        id: event.getId(),
        title: event.getTitle(),
        date: event.getStartTime().toISOString(),
        startTime: event.getStartTime().toISOString(),
        endTime: event.getEndTime().toISOString()  
      };
    });

    return eventList;
  } catch (error) {
    return []; // Return an empty array if there's an error
  }
}

function addEventToCells(eventId, eventTitle, eventDate, eventStart, eventEnd) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var linkCell = sheet.getActiveCell();
  var titleCell = linkCell.offset(0, 1);
  var dateCell = linkCell.offset(0, 2);
  var startTimeCell = linkCell.offset(0, 3);
  var endTimeCell = linkCell.offset(0, 4);

  let eventUrl = 'https://calendar.google.com/calendar/u/0/r/eventedit/' + eventId;

  // Format date strings
  let date = new Date(eventDate);
  let dayOptions = {
    weekday: 'short',
    month: 'long',
    day: 'numeric'
  }

  let formattedEventDate = date.toLocaleDateString('en-US', dayOptions); // @todo accept user's time zone here.

  // Format time
  const startTime = new Date(eventStart);
  const endTime = new Date(eventEnd);
  const timeOptions = {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  }

  const formattedStartTime = startTime.toLocaleTimeString('en-US', timeOptions);
  const formattedEndTime = endTime.toLocaleTimeString('en-US', timeOptions);

  linkCell.setValue(eventUrl);
  titleCell.setValue(eventTitle);
  dateCell.setValue(formattedEventDate);
  startTimeCell.setValue(formattedStartTime);
  endTimeCell.setValue(formattedEndTime);

}


// Test function to fetch events from a specific calendar
function testFetchEvents() {
  var calendars = CalendarApp.getAllCalendars();
  if (calendars.length > 0) {
    var events = calendars[0].getEvents(new Date(), new Date(new Date().setMonth(new Date().getMonth() + 2)));
    // events.map(function(event) {
    //   Logger.log(event.getTitle())
    // })
    Logger.log(events);
  } else {
    Logger.log('No calendars found.');
  }
}


  function dateFromTime(dateValue, timeToChange) {
    const timeParts = timeToChange.match(/(\d+):(\d+)\s*(AM|PM)/i);

    if (timeParts) {
      var hours = parseInt(timeParts[1], 10);
      var minutes = parseInt(timeParts[2], 10);
      var period = timeParts[3].toUpperCase();
    
      // Convert the hours to 24-hour format if necessary
      if (period === 'PM' && hours < 12) {
        hours += 12;
      } else if (period === 'AM' && hours === 12) {
        hours = 0;
      }
    
      // Combine the date and time
      dateValue.setHours(hours);
      dateValue.setMinutes(minutes);
      dateValue.setSeconds(0); // Set seconds to 0

      return dateValue;
    }
  }

function sendCalendarInvite() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var range = sheet.getActiveRange();

  var checkboxColumn = 9; // Adjust to the column number where checkboxes are (G is 7)
  Logger.log('Range.getvalue: ' + range.getValue());

  if (range.getColumn() === checkboxColumn && range.getValue() === true) {
    var row = range.getRow();
    
    var eventTitle = sheet.getRange(row, 2).getValue(); // Event Title in column A
    var eventDate = sheet.getRange(row, 3).getValue(); // Event Date in column B
    var startTime = sheet.getRange(row, 4).getValue(); // Start Time in column C
    var endTime = sheet.getRange(row, 5).getValue(); // End Time in column D
    var userName = sheet.getRange(row, 7).getValue(); // User Name in column E
    var userEmail = sheet.getRange(row, 8).getValue(); // User Email in column F

    // Parse the time string to extract hours and minutes


    var startDateTime = dateFromTime(new Date(eventDate), startTime);
    var endDateTime = dateFromTime(new Date(eventDate), endTime);
    Logger.log(`Event date from cell ${eventDate}`)
    Logger.log('Start time from cell: ' + startTime)
    Logger.log('End time from cell: ' + endTime)
    Logger.log(' Event start date time' + startDateTime);
    Logger.log(' Event end date time' + endDateTime);
    Logger.log('Event title from checkbox edit ' + eventTitle)
    Logger.log('username: ' + userName)
    Logger.log('email: ' + userEmail)

    try {
      var calendar = CalendarApp.getDefaultCalendar();
      // Create an event 30 mins before the start time.
      let adjustedStartTime = new Date(startDateTime).getTime() - 30 * 60 * 1000;
      calendar.createEvent(`✨ Facilitation for: ${eventTitle}`, new Date(adjustedStartTime), new Date(startDateTime), {
        guests: userEmail,
        sendInvites: true
      });
      // }

      sheet.getRange(row, parseInt(checkboxColumn + 1)).setValue('🎉 Invite sent 🎉');
      Logger.log('Event created successfully for ' + userName);
    } catch (error) {
      Logger.log('Error creating event: ' + error.message);
    }
  }
}

function testDatefromTime() {
  Logger.log(dateFromTime(new Date('Wed Aug 28 2024 12:00:00 GMT-0400 (Eastern Daylight Time)'), '4:00pm'))
}



