(async () => {
  showLoadingOverlay();
  
  const [user, userJob, userAppointments, userPatients, userRequestsReceived] = await Promise.all([
    fetchJson('/grab/user'),
    fetchJson('/grab/user/job'),
    fetchJson('/grab/user/appointments'),
    fetchJson('/grab/user/patients'),
    fetchJson('/grab/user/requests-received')
  ]);
  const staff = [], patients = [];

  /* Fill the basic info */

  document.getElementById('name').textContent = user.firstname + ' ' + user.lastname;
  document.getElementById('role').textContent = userJob.title ?? 'Patient';
  document.getElementById('profile-pic').src = user.profilepicturepath;
  
  // Main data has been obtained and placed on the dashboard: stop loading
  hideLoadingOverlay();
})();