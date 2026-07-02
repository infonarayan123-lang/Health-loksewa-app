function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  data.shift(); // remove header row

  var rows = data.map(function(row) {
    var obj = {};
    headers.forEach(function(header, i) {
      obj[header] = row[i];
    });
    return obj;
  });

  var action = e.parameter.action || 'questions';

  // ---- Lightweight: just the list of subjects (for populating dropdowns fast) ----
  if (action === 'subjects') {
    var subjects = [...new Set(rows.map(function(r){ return r.Subject; }).filter(Boolean))];
    return respond(subjects);
  }

  // ---- Random sample, picked on the server (used for Mock Test, and "All Subjects" practice) ----
  if (action === 'random') {
    var count = parseInt(e.parameter.count, 10) || 100;
    var subject = e.parameter.subject;
    var pool = (subject && subject !== '__ALL__')
      ? rows.filter(function(r){ return r.Subject === subject; })
      : rows;
    var shuffled = pool.sort(function(){ return Math.random() - 0.5; });
    return respond(shuffled.slice(0, count));
  }

  // ---- Default: filter by a single subject if given, else return everything ----
  // (Only used as a fallback; the app avoids requesting "everything" once your
  // question bank grows large, to keep loading fast.)
  var subjectFilter = e.parameter.subject;
  var result = (subjectFilter && subjectFilter !== '__ALL__')
    ? rows.filter(function(r){ return r.Subject === subjectFilter; })
    : rows;
  return respond(result);
}

function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
