const CONFIG={googleAppsScriptUrl:"REPLACE_ME"};

async function apiRequest(action,payload={}){
 const res=await fetch(CONFIG.googleAppsScriptUrl,{
  method:"POST",
  headers:{"Content-Type":"application/json"},
  body:JSON.stringify({action,...payload})
 });
 return res.json();
}

console.log("fixed script loaded");
