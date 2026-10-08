(function(){
  const map=[
    ['Dashboard','/app'],['Medical Records','/app/records'],['Health Timeline','/app/timeline'],['Report Comparison','/app/compare'],
    ['Physical Health','/app/physical'],['Fitness','/app/fitness'],['Mental Wellness','/app/wellness'],['Nutrition','/app/nutrition'],
    ['Ask HealthMemory','/app/ai'],['Smart Reminders','/app/reminders'],['Health Alerts','/app/alerts'],['Doctor Brief','/app/doctor'],
    ['Emergency','/app/emergency'],['Emergency / SOS','/app/emergency'],['Health Sphere','/app/health-sphere'],['Profile','/app/profile'],
    ['Patient Profile','/app/profile'],['Settings','/app/settings'],['Preferences','/app/settings'],['Privacy','/app/privacy'],
    ['Privacy & Security','/app/privacy'],['Upload Record','/app/records/upload'],['+ Upload Record','/app/records/upload'],
    ['View all records','/app/records'],['Compare','/app/compare'],['View Extracted Data','/app/timeline'],['Compare with 2025','/app/compare'],
    ['Create Post','/app/health-sphere']
  ];
  function txt(el){return (el.innerText||el.textContent||'').replace(/\s+/g,' ').trim()}
  function go(path){try{window.parent.location.href=path}catch(e){location.href=path}}
  function init(){
    document.querySelectorAll('a').forEach(a=>{
      if(a.getAttribute('data-hm-native')==='true') return;
      const t=txt(a); const found=map.find(([label])=>t===label||t.startsWith(label+' '));
      if(found) a.addEventListener('click',e=>{e.preventDefault();go(found[1])});
    });
    document.querySelectorAll('button').forEach(b=>{
      if(['submit-cta','submitBtn','ai-submit-button','trigger-upload-btn','real-file-input','file-selector'].includes(b.id)) return;
      const t=txt(b); const found=map.find(([label])=>t===label||t.startsWith(label+' '));
      if(found) b.addEventListener('click',e=>{e.preventDefault();go(found[1])});
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
