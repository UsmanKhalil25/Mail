document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector("#compose-form").addEventListener("submit",sendMail);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  
  fetch(`/emails/${mailbox}`)
  .then((response) => response.json())
  .then((emails) => {
      // Print emails
      emails.forEach((email)=>{
        const emailElement = document.createElement("div");
        emailElement.innerHTML =`
            <div class ="d-flex">
              <p><strong>${email.sender}</strong></p>  
              <p class ="ms-4">${email.subject}</p>  
            </div>
            <div>
              <p>${email.timestamp}</p>
            </div>
        `
        emailElement.className = email.read? "email-box background-gray":"email-box background-white";
        emailElement.addEventListener("click",()=>{
          viewMail(email.id)
        })
        document.querySelector("#emails-view").append(emailElement);
      })
  });
}

function sendMail(event){

  event.preventDefault();
  const recipients =  document.querySelector('#compose-recipients').value;
  const subject =  document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  fetch("/emails",{
    method:"POST",
    body:JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body
    })
  })
  .then ((response)=> response.json())
  .then((result)=>{
    load_mailbox("sent");
  })

}

function viewMail(id){
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';

  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then((email) => {
        document.querySelector("#email-view") .innerHTML = `
        <div>
          <strong>From: </strong>${email.sender}
          <br>
          <strong>To: </strong>${email.recipients}
          <br>
          <strong>Subject: </strong>${email.subject}
          <br>
          <strong>Timestamp: </strong>${email.timestamp}
          <br>

          <button class="btn btn-outline-primary mt-3" id="reply">Reply</button>
          <button class="btn btn-outline-primary mt-3" id="archive"></button>
          <hr>
          <p>${email.body}</p>
        </div>
        `
        document.querySelector("#archive").innerHTML = email.archived?"Unarchive":"Archive";
        document.querySelector("#archive").className = email.archived?"btn btn-outline-danger mt-3":"btn btn-outline-primary mt-3";
        document.querySelector("#archive").addEventListener("click",()=>{

          fetch(`/emails/${id}`, {
            method: 'PUT',
            body: JSON.stringify({
                archived:!email.archived
            })
          })

          .then(()=> load_mailbox("archive"));
        })

        document.querySelector("#reply").addEventListener("click",()=>{
          compose_email();

          let subject =email.subject;
          if(!subject.startsWith("Re: ")){
            subject = "Re: "+subject;
          }
          
         document.querySelector('#compose-recipients').value = `${email.sender}`;
          document.querySelector('#compose-subject').value = subject;
          document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote: ${email.body}`;
        })

      if(!email.read){
        fetch(`/emails/${id}`, {
          method: 'PUT',
          body: JSON.stringify({
              read: true
          })
        })
      }
      
  });

}