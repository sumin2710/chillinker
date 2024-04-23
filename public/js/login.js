$(document).ready(function () {
  $('#login-form').submit(function (e) {
    e.preventDefault();

    $.ajax({
      url: '/users/login',
      type: 'POST',
      data: $(this).serialize(),
      success: function (data) {
        window.location.href = '/main';
      },
      contentType: 'multipart/form-data',
      error: function (response) {
        alert(response.responseJSON.message);
      },
    });
  });
});
