function doPost(e){
 try{
  const payload=JSON.parse(e.postData.contents||"{}");
  const action=payload.action;

  let result={};

  switch(action){
    case "register": result=register_(payload); break;
    case "login": result=login_(payload); break;
    case "listTests": result=listTests_(payload); break;
    case "listNotes": result=listNotes_(payload); break;
    case "getQuestions": result=getQuestions_(payload); break;
    case "submitResult": result=submitResult_(payload); break;
    case "myResults": result=myResults_(payload); break;
    default: throw new Error("Invalid action");
  }

  return ContentService.createTextOutput(JSON.stringify({ok:true,...result}))
  .setMimeType(ContentService.MimeType.JSON);

 }catch(err){
  return ContentService.createTextOutput(JSON.stringify({ok:false,error:err.message}))
  .setMimeType(ContentService.MimeType.JSON);
 }
}

function listTests_(){return{tests:[{testName:"Demo",subject:"Nursing",duration:10,status:"Active",accessType:"Free",questionCount:10}]};}
function listNotes_(){return{notes:[{noteTitle:"Demo Note",subject:"Nursing",description:"Demo",status:"Active",accessType:"Free"}]};}
function getQuestions_(){return{test:{testName:"Demo",subject:"Nursing",duration:10},questions:[{question:"Q1?",options:{A:"a",B:"b",C:"c",D:"d"}}]};}
function submitResult_(){return{result:{score:"1/1",percentage:100}};}
function myResults_(){return{results:[]};}
function login_(){return{user:{userId:"U1",name:"Test",token:"123"}};}
function register_(){return{user:{userId:"U1",name:"Test",token:"123"}};}
