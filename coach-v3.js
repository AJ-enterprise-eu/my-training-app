/* My Training Coach v3: progressive overload + RIR + detailed history */
(function(){
"use strict";

var DETAIL_KEY="mt_history_detail_v3";
var COACH_KEY="mt_coach_v3";
var PREF_KEY="mt_ex_prefs_v3";
var cfg=Object.assign({increment:2.5,targetRir:2,compoundRest:120,isolationRest:90},JSON.parse(localStorage.getItem(COACH_KEY)||"{}"));
var compounds=["Barbell Bench Press","Incline Dumbbell Press","Decline Bench Press","Lat Pulldown","Seated Cable Row","Chest-Supported Row","Leg Press","Hack Squat","Seated Dumbbell Press","Dip Machine"];
var cues={
"Barbell Bench Press":"Keep shoulder blades back, feet planted, and lower the bar under control.",
"Incline Dumbbell Press":"Use a moderate incline, keep your chest high, and control the stretch.",
"Machine Chest Fly":"Lead with the elbows and squeeze the chest without rolling the shoulders forward.",
"Decline Bench Press":"Stay tight on the bench and use a controlled range that feels stable.",
"Cable Crossover":"Keep a soft elbow bend and move through the chest rather than the shoulders.",
"Lat Pulldown":"Drive your elbows toward your hips and avoid turning the movement into a row.",
"Seated Cable Row":"Keep the torso stable and pull the elbows back without shrugging.",
"Chest-Supported Row":"Keep your chest on the pad and pause briefly at the contracted position.",
"Single-Arm Lat Pulldown":"Reach long at the top and pull the elbow down toward your hip.",
"Straight-Arm Pulldown":"Keep the arms nearly straight and move from the shoulder joint.",
"Leg Press":"Use the deepest range you can control without your lower back rounding.",
"Hack Squat":"Keep the knees tracking over the toes and control the bottom position.",
"Leg Extension":"Control the lowering and squeeze the quads at the top.",
"Seated Leg Curl":"Keep the hips down and curl smoothly without bouncing.",
"Standing Calf Raise":"Pause in the stretch and use a full controlled range.",
"Seated Dumbbell Press":"Keep the ribs down and press slightly inward with control.",
"Lateral Raise Machine":"Lead with the elbows and stop before the traps take over.",
"Cable Lateral Raise":"Keep tension from the bottom and avoid swinging.",
"Reverse Pec Deck":"Move from the rear delts and keep the traps relaxed.",
"Face Pull":"Pull toward eye level and rotate the hands apart at the finish.",
"EZ-Bar Curl":"Keep the upper arms quiet and avoid leaning back.",
"Rope Triceps Pushdown":"Keep the elbows pinned and fully extend without shoulder movement.",
"Incline Dumbbell Curl":"Let the biceps stretch while keeping the shoulders behind the torso.",
"Overhead Cable Extension":"Keep the elbows pointed forward and allow a deep triceps stretch.",
"Hammer Curl":"Keep a neutral grip and control the lowering.",
"Dip Machine":"Keep the shoulders depressed and use a stable pain-free range."
};
var alternatives={
"Barbell Bench Press":["Machine Chest Press","Dumbbell Bench Press"],
"Incline Dumbbell Press":["Incline Chest Press Machine","Incline Smith Press"],
"Machine Chest Fly":["Pec Deck","Cable Fly"],
"Decline Bench Press":["Machine Chest Press","Smith Machine Press"],
"Cable Crossover":["Low-to-High Cable Fly","Dumbbell Fly"],
"Lat Pulldown":["Neutral-Grip Pulldown","Assisted Pull-Up"],
"Seated Cable Row":["Machine Row","Chest-Supported T-Bar Row"],
"Chest-Supported Row":["One-Arm Machine Row","Dumbbell Row"],
"Single-Arm Lat Pulldown":["Kneeling Pulldown","Single-Arm Cable Row"],
"Straight-Arm Pulldown":["Cable Pullover","Machine Pullover"],
"Leg Press":["Hack Squat","Smith Squat"],
"Hack Squat":["Pendulum Squat","Smith Squat"],
"Leg Extension":["Single-Leg Extension","Sissy Squat"],
"Seated Leg Curl":["Lying Leg Curl","Standing Leg Curl"],
"Standing Calf Raise":["Seated Calf Raise","Leg Press Calf Raise"],
"Seated Dumbbell Press":["Shoulder Press Machine","Smith Shoulder Press"],
"Lateral Raise Machine":["Dumbbell Lateral Raise","Cable Lateral Raise"],
"Cable Lateral Raise":["Lean-Away Cable Lateral Raise","Dumbbell Lateral Raise"],
"Reverse Pec Deck":["Cable Rear-Delt Fly","Chest-Supported Rear-Delt Raise"],
"Face Pull":["Rear-Delt Cable Row","Cable External Rotation"],
"EZ-Bar Curl":["Cable Curl","Machine Preacher Curl"],
"Rope Triceps Pushdown":["Straight-Bar Pushdown","Machine Dip"],
"Incline Dumbbell Curl":["Bayesian Cable Curl","Preacher Curl"],
"Overhead Cable Extension":["Overhead Dumbbell Extension","EZ-Bar Skull Crusher"],
"Hammer Curl":["Rope Hammer Curl","Cross-Body Hammer Curl"],
"Dip Machine":["Close-Grip Press","Assisted Dip"]
};

function n(v){var x=parseFloat(String(v).replace(",","."));return isFinite(x)?x:0}
function parseRange(s){var m=String(s).match(/(\d+)\D+(\d+)/);return m?[+m[1],+m[2]]:[8,12]}
function detailHistory(){return JSON.parse(localStorage.getItem(DETAIL_KEY)||"[]")}
function saveDetail(h){localStorage.setItem(DETAIL_KEY,JSON.stringify(h))}
function prefs(){return JSON.parse(localStorage.getItem(PREF_KEY)||"{}")}
function savePrefs(x){localStorage.setItem(PREF_KEY,JSON.stringify(x))}
function applyPrefs(dayData){
 var p=prefs();
 dayData.forEach(function(ex){
  var q=p[ex.name];
  if(q){
   if(typeof q.machine!=="undefined")ex.machine=q.machine;
   if(typeof q.notes!=="undefined")ex.notes=q.notes;
   if(typeof q.rest!=="undefined")ex.rest=q.rest;
  }
 });
 return dayData
}
function lastExercise(name){
 var h=detailHistory();
 for(var i=0;i<h.length;i++){var xs=h[i].exercises||[];for(var j=0;j<xs.length;j++){if(xs[j].name===name)return xs[j]}}
 return null
}
function fmtLast(rec){
 if(!rec||!rec.sets||!rec.sets.length)return "No previous performance yet.";
 var s=rec.sets.filter(function(x){return n(x.weight)>0&&n(x.reps)>0});
 if(!s.length)return "No completed weighted sets yet.";
 var max=Math.max.apply(null,s.map(function(x){return n(x.weight)}));
 return "Last: "+max+" kg · reps "+s.map(function(x){return x.reps}).join("/")+" · RIR "+s.map(function(x){return x.rir===""?"–":x.rir}).join("/");
}
function recommendation(ex){
 var rec=lastExercise(ex.name),rg=parseRange(ex.target),lo=rg[0],hi=rg[1];
 if(!rec)return {label:"START",weight:0,text:"Choose a controlled load for "+lo+"–"+hi+" reps and finish around RIR "+cfg.targetRir+".",last:"No previous performance yet."};
 var sets=(rec.sets||[]).filter(function(x){return n(x.weight)>0&&n(x.reps)>0});
 if(!sets.length)return {label:"START",weight:0,text:"Choose a controlled load for "+lo+"–"+hi+" reps.",last:fmtLast(rec)};
 var base=Math.max.apply(null,sets.map(function(x){return n(x.weight)}));
 var same=sets.filter(function(x){return n(x.weight)===base});
 var reps=same.map(function(x){return n(x.reps)});
 var rirs=same.map(function(x){return x.rir===""?cfg.targetRir:n(x.rir)});
 var minRep=Math.min.apply(null,reps),allTop=reps.every(function(x){return x>=hi}),avg=rirs.reduce(function(a,b){return a+b},0)/rirs.length;
 if(allTop&&avg>=1){var up=Math.round((base+cfg.increment)/cfg.increment)*cfg.increment;return {label:"INCREASE",weight:up,text:"Increase to "+up+" kg. Aim for "+lo+"–"+Math.min(hi,lo+2)+" clean reps at about RIR "+cfg.targetRir+".",last:fmtLast(rec)}}
 if(minRep<lo||avg<0.5){var down=Math.max(cfg.increment,Math.round((base*.95)/cfg.increment)*cfg.increment);return {label:"REDUCE",weight:down,text:"Reduce to about "+down+" kg and get every work set back inside "+lo+"–"+hi+" reps.",last:fmtLast(rec)}}
 var total=reps.reduce(function(a,b){return a+b},0);return {label:"BUILD REPS",weight:base,text:"Keep "+base+" kg and beat your previous "+total+" total reps while staying near RIR "+cfg.targetRir+".",last:fmtLast(rec)}
}
function isCompound(name){return compounds.indexOf(name)>=0}
function restFor(name){return isCompound(name)?cfg.compoundRest:cfg.isolationRest}
function esc(s){return String(s||"").replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]})}

var css=document.createElement("style");
css.textContent=".coachbox{background:#0d1726;border:1px solid #234a7d;border-radius:14px;padding:10px;margin:0 0 11px}.coachhead{display:flex;justify-content:space-between;color:#8dc0ff;font-size:11px;font-weight:900}.coachmsg{font-size:13px;line-height:1.4;margin-top:5px}.coachlast{color:#98a2b1;font-size:11px;margin-top:5px}.coachapply{margin-top:7px;border:1px solid #315e99;background:#12223a;color:#91c2ff;border-radius:10px;padding:7px 9px;font-size:11px;font-weight:800}.setHead.v3,.setRow.v3{grid-template-columns:34px 1fr 1fr 1fr 42px}.rirselect{width:100%;background:#0c1015;border:1px solid #303845;color:#fff;border-radius:10px;padding:9px 3px;text-align:center}.v3actions{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:10px}.v3actions button{border:1px solid #313946;background:#191e26;color:#dce2ea;border-radius:11px;padding:9px 5px;font-size:11px;font-weight:800}.coachmodal{position:fixed;inset:0;z-index:90;background:rgba(4,6,9,.97);display:none;align-items:center;justify-content:center;padding:20px}.coachmodal.show{display:flex}.coachcard{width:min(430px,100%);max-height:82vh;overflow:auto;background:#12161d;border:1px solid #2a313c;border-radius:20px;padding:15px}.coachclose{float:right;width:33px;height:33px;border-radius:50%;border:0;background:#222831;color:#fff}.coachitem{border-top:1px solid #262d37;padding:9px 0;font-size:12px}.coachchoice{width:100%;margin:5px 0;border:1px solid #313946;background:#191e26;color:#fff;border-radius:11px;padding:10px}.coachsettings{background:#12151b;border:1px solid #252c36;border-radius:18px;padding:13px;margin:12px 0}.coachsettings label{display:grid;grid-template-columns:1fr 100px;gap:10px;align-items:center;margin:8px 0;font-size:12px}.coachsettings input,.coachsettings select{background:#0c1015;border:1px solid #303845;color:#fff;border-radius:9px;padding:8px}";
document.head.appendChild(css);
var modal=document.createElement("div");modal.className="coachmodal";modal.id="coachModal";modal.innerHTML='<div class="coachcard"><button class="coachclose" onclick="coachClose()">×</button><div id="coachModalBody"></div></div>';document.body.appendChild(modal);

window.coachClose=function(){document.getElementById("coachModal").classList.remove("show")};
function coachOpen(html){document.getElementById("coachModalBody").innerHTML=html;document.getElementById("coachModal").classList.add("show")}

function ensureRir(dayData){
 dayData.forEach(function(ex){ex.rows.forEach(function(r){if(typeof r.rir==="undefined")r.rir=""})});
 return dayData
}
var originalGet=getDayData;
(function migratePrefsOnce(){
 if(localStorage.getItem("mt_prefs_migrated_v3"))return;
 var p=prefs();
 ["Mon","Tue","Wed","Thu","Fri"].forEach(function(day){
  var d=originalGet(day);
  d.forEach(function(ex){
   p[ex.name]=Object.assign({},p[ex.name]||{},{
    machine:ex.machine||"",
    notes:ex.notes||"",
    rest:restFor(ex.name)
   });
  });
 });
 savePrefs(p);
 localStorage.setItem("mt_prefs_migrated_v3","1");
})();
getDayData=function(day){var d=ensureRir(applyPrefs(originalGet(day)));saveDayData(day,d);return d};

updEx=function(ei,f,v){
 var d=getDayData(activeDay),ex=d[ei];ex[f]=v;saveDayData(activeDay,d);
 if(f==="machine"||f==="notes"){
  var p=prefs();p[ex.name]=Object.assign({},p[ex.name]||{});p[ex.name][f]=v;savePrefs(p)
 }
 renderExercises()
};
updRest=function(ei,v){
 var d=getDayData(activeDay),ex=d[ei];ex.rest=parseInt(v);saveDayData(activeDay,d);
 var p=prefs();p[ex.name]=Object.assign({},p[ex.name]||{});p[ex.name].rest=ex.rest;savePrefs(p);renderExercises()
};

renderExercises=function(){
 var list=document.getElementById("exerciseList"),d=getDayData(activeDay),prMap=prs();list.innerHTML="";
 if(!d.length){list.innerHTML='<div class="empty">Rest day — recover and come back ready.</div>';return}
 d.forEach(function(ex,ei){
  var rec=recommendation(ex),done=ex.rows.filter(function(r){return r.done}).length,card=document.createElement("div");
  card.className="exercise"+(ei===0?" open":"");card.id="ex-"+ei;
  var rows=ex.rows.map(function(r,si){
   var opts='<option value="">RIR</option>'+[0,1,2,3,4].map(function(v){return '<option value="'+v+'" '+(String(r.rir)===String(v)?"selected":"")+'>'+v+'</option>'}).join("");
   return '<div class="setRow v3"><div class="setNum">'+(si+1)+'</div><input class="smallInput" inputmode="decimal" value="'+esc(r.weight)+'" placeholder="kg" onchange="updSet('+ei+','+si+',\'weight\',this.value)"><input class="smallInput" inputmode="numeric" value="'+esc(r.reps)+'" placeholder="'+esc(ex.target)+'" onchange="updSet('+ei+','+si+',\'reps\',this.value)"><select class="rirselect" onchange="coachRir('+ei+','+si+',this.value)">'+opts+'</select><button class="check '+(r.done?"done":"")+'" onclick="completeSet('+ei+','+si+')">'+(r.done?"✓":"○")+'</button></div>'
  }).join("");
  var pr=prMap[ex.name]?'<span class="pr">PR '+prMap[ex.name]+' kg</span>':"";
  var apply=rec.weight?'<button class="coachapply" onclick="coachApply('+ei+','+rec.weight+')">Use '+rec.weight+' kg for empty sets</button>':"";
  card.innerHTML='<div class="exHeader"><div class="thumb">'+(ex.icon||"🏋️")+'</div><div><div class="exTitle">'+esc(ex.name)+pr+'</div><div class="exSub">'+ex.sets+' sets · '+esc(ex.target)+' reps · '+ex.rest+' sec rest</div><div class="machineTag">📍 <span>'+esc(ex.machine||"Machine")+'</span></div></div><button class="chev" onclick="toggleEx('+ei+')">'+(done===ex.rows.length?"✓":"⌄")+'</button></div><div class="exBody"><div class="coachbox"><div class="coachhead"><span>COACH · '+rec.label+'</span><span>'+(isCompound(ex.name)?"COMPOUND":"ISOLATION")+'</span></div><div class="coachmsg">'+rec.text+'</div><div class="coachlast">'+rec.last+'</div>'+apply+'</div><div class="setHead v3"><div>SET</div><div>KG</div><div>REPS</div><div>RIR</div><div></div></div>'+rows+'<div class="rowMeta"><div class="field"><label>Machine / station</label><input value="'+esc(ex.machine)+'" onchange="updEx('+ei+',\'machine\',this.value)"></div><div class="field"><label>Rest time</label><select onchange="updRest('+ei+',this.value)">'+[60,75,90,120,150,180].map(function(v){return '<option value="'+v+'" '+(ex.rest==v?"selected":"")+'>'+v+' sec</option>'}).join("")+'</select></div></div><div class="field" style="margin-top:8px"><label>Notes / seat / pin / grip</label><textarea placeholder="Seat position, grip, machine pin, form cue..." onchange="updEx('+ei+',\'notes\',this.value)">'+esc(ex.notes||"")+'</textarea></div><div class="v3actions"><button onclick="coachHistory('+ei+')">History</button><button onclick="coachForm('+ei+')">Form tips</button><button onclick="coachSwap('+ei+')">Swap</button></div></div>';
  list.appendChild(card)
 })
};

window.coachRir=function(ei,si,v){var d=getDayData(activeDay);d[ei].rows[si].rir=v;saveDayData(activeDay,d)};
window.coachApply=function(ei,w){var d=getDayData(activeDay);d[ei].rows.forEach(function(r){if(!r.weight)r.weight=w});saveDayData(activeDay,d);renderExercises();toast("Coach target applied")};
window.coachHistory=function(ei){
 var ex=getDayData(activeDay)[ei],h=detailHistory(),out=[];
 h.forEach(function(w){(w.exercises||[]).forEach(function(x){if(x.name===ex.name)out.push({date:w.date,x:x})})});
 var html="<h2>"+esc(ex.name)+" history</h2>";
 if(!out.length)html+='<div class="empty">No detailed history yet. Finish a workout first.</div>';
 else out.slice(0,6).forEach(function(r){html+='<div class="coachitem"><b>'+new Date(r.date).toLocaleDateString()+'</b><div>'+r.x.sets.map(function(s,i){return "Set "+(i+1)+": "+s.weight+" kg × "+s.reps+" · RIR "+(s.rir===""?"–":s.rir)}).join("<br>")+"</div></div>"});
 coachOpen(html)
};
window.coachForm=function(ei){var ex=getDayData(activeDay)[ei];coachOpen("<h2>"+esc(ex.name)+"</h2><p>"+esc(cues[ex.name]||"Use a controlled range of motion and stop the set when form breaks down.")+"</p><div class='coachitem'>Target: "+esc(ex.target)+" reps · "+ex.rest+" sec rest · target RIR "+cfg.targetRir+"</div>")};
window.coachSwap=function(ei){var ex=getDayData(activeDay)[ei],opts=[ex.name].concat(alternatives[ex.name]||[]),html="<h2>Swap exercise</h2><p class='meta'>Choose an alternative for this workout.</p>";opts.forEach(function(x){html+='<button class="coachchoice" onclick="coachChooseSwap('+ei+',\''+x+'\')">'+esc(x)+"</button>"});coachOpen(html)};
window.coachChooseSwap=function(ei,name){var d=getDayData(activeDay),ex=d[ei];ex.name=name;ex.rows.forEach(function(r){r.done=false;r.weight="";r.reps="";r.rir=""});ex.rest=restFor(name);saveDayData(activeDay,d);coachClose();renderAll();toast("Exercise swapped")};

finishWorkout=function(){
 if(!session||session.day!==activeDay)return;
 var d=getDayData(activeDay),completed=0,volume=0,detail=[];
 d.forEach(function(ex){
  var sets=ex.rows.filter(function(r){return r.done}).map(function(r){completed++;volume+=n(r.weight)*n(r.reps);return {weight:n(r.weight),reps:n(r.reps),rir:r.rir,done:true}});
  detail.push({name:ex.name,target:ex.target,machine:ex.machine,notes:ex.notes||"",sets:sets})
 });
 var dh=detailHistory();dh.unshift({date:new Date().toISOString(),day:activeDay,name:PLAN[activeDay].name,exercises:detail});saveDetail(dh.slice(0,150));
 var h=history();h.unshift({date:new Date().toISOString(),day:activeDay,name:PLAN[activeDay].name,sets:completed,volume:Math.round(volume),minutes:Math.max(1,Math.round((Date.now()-session.start)/60000))});saveHistory(h.slice(0,100));
 localStorage.removeItem(dataKey(activeDay));localStorage.removeItem("mt_session");session=null;toast("Workout saved — next targets updated");renderAll()
};

var oldRenderPlan=renderPlan;
renderPlan=function(){oldRenderPlan();var box=document.createElement("div");box.className="coachsettings";box.innerHTML='<b>Coach settings</b><label>Weight increase<input id="coachInc" inputmode="decimal" value="'+cfg.increment+'"></label><label>Target RIR<select id="coachRirTarget"><option>1</option><option '+(cfg.targetRir==2?"selected":"")+'>2</option><option '+(cfg.targetRir==3?"selected":"")+'>3</option></select></label><label>Compound rest<select id="coachComp"><option>90</option><option '+(cfg.compoundRest==120?"selected":"")+'>120</option><option '+(cfg.compoundRest==150?"selected":"")+'>150</option><option '+(cfg.compoundRest==180?"selected":"")+'>180</option></select></label><label>Isolation rest<select id="coachIso"><option>60</option><option '+(cfg.isolationRest==90?"selected":"")+'>90</option><option '+(cfg.isolationRest==120?"selected":"")+'>120</option></select></label><button class="primary" style="width:100%" onclick="coachSaveSettings()">Save coach settings</button>';document.getElementById("planList").prepend(box)};
window.coachSaveSettings=function(){
 cfg.increment=n(document.getElementById("coachInc").value)||2.5;
 cfg.targetRir=parseInt(document.getElementById("coachRirTarget").value)||2;
 cfg.compoundRest=parseInt(document.getElementById("coachComp").value)||120;
 cfg.isolationRest=parseInt(document.getElementById("coachIso").value)||90;
 localStorage.setItem(COACH_KEY,JSON.stringify(cfg));
 var p=prefs();
 ["Mon","Tue","Wed","Thu","Fri"].forEach(function(day){
  var d=originalGet(day);
  d.forEach(function(ex){
   ex.rest=restFor(ex.name);
   p[ex.name]=Object.assign({},p[ex.name]||{}, {rest:ex.rest});
  });
  saveDayData(day,d)
 });
 savePrefs(p);renderAll();toast("Coach settings saved")
};

renderAll();
})();