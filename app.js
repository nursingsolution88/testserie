const API =
"https://script.google.com/macros/s/AKfycby7NJhNamHWoVK3yPZrEOAk6JeEN5yTByzXnsYcIKQK7K2XViLIrgPSPGRmM17bMQY/exec?action=tests";

let tests=[];

async function loadTests(){

const res=await fetch(API);

tests=await res.json();

showTests(tests);

}

function showTests(data){

const box=document.getElementById("tests");

box.innerHTML="";

data.forEach(t=>{

box.innerHTML+=`

<div class="card">

<h3>${t.title}</h3>

<p>${t.category}</p>

<span class="badge ${t.type}">
${t.type.toUpperCase()}
</span>

<p>
Questions : ${t.questions}
</p>

<a
class="btn"
href="test.html?id=${t.id}"
>
Start Test
</a>

</div>

`;

});

}

document
.getElementById("search")
.addEventListener("keyup",e=>{

const q=e.target.value.toLowerCase();

showTests(
tests.filter(x=>
x.title.toLowerCase().includes(q)
)
);

});

loadTests();
