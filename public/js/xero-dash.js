var selected = "a";

function clickFunc(data) {
  console.log(data);
  console.log(selected);
  if (selected !== data) {
    $('#' + selected).css('background-color', '');
    selected = data;
    $('#' + data).css('background-color', 'lightgrey');

    
    const len = window.accessTokens.length;
    for (let i = 0; i < len; i++) {
      if (window.accessTokens[i]['token'] === data) {
        // inputToken
        // inputName
        $('#inputToken').val(window.accessTokens[i]['token']);
        $('#inputName').val(window.accessTokens[i]['forName']);
        $('#inputUsed').prop('checked', window.accessTokens[i]['used']);
        $('#inputId').val(window.accessTokens[i]['_id']);

        break;
      }
    }
  } else {
    selected = 'a';
    $('#' + data).css('background-color', '');
    $('#inputToken').val('');
    $('#inputName').val('');
    $('#inputUsed').prop('checked', false);
    $('#inputId').val('');
  }
}

var xmlHttp = new XMLHttpRequest();
xmlHttp.onreadystatechange = function () {
  if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
    let data = JSON.parse(xmlHttp.responseText);
    window.accessTokens = data;

    $('#dataBody').empty();
    let htmlData = "";

    const len = data.length;
    for (let i = 0; i < len; i++) {
      let element = "<tr " + (data[i]['used']? 'class="used"' : '') + "id=\"" + data[i]['token'] + "\" onclick=\"clickFunc('" + data[i]['token'] + "')\">";

      element += "<td>" + data[i]['token'] + "</td>";
      element += "<td>" + data[i]['forName'] + "</td>";
      element += "<td>" + new Date(data[i]['created']).toUTCString() + "</td>";
      element += "<td>" + data[i]['createdBy'] + "</td>";
      element += "<td>" + data[i]['used'] + "</td>";
      element += "<td>" + new Date(data[i]['updated']).toUTCString() + "</td>";

      element += "</tr>";
      htmlData += element;
    }

    $('#dataBody').append(htmlData);
    $('#dataTable').DataTable();

    // var socket = io.connect('http://localhost:8080');
    // socket.on('connect', function(data) {
    //   socket.emit('join', 'Hello World from client');
    // });

    // socket.on('broad', function(data) {
      
    // });

  }
}
xmlHttp.open("GET", '/tokens', true); // true for asynchronous 
xmlHttp.send(null);