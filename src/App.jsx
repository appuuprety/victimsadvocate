import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabaseClient'

const T = {
  en: {
    tagline:'Victim Advocacy Network of Colorado',hero_label:'You Are Not Alone',
    hero_title:'Finding the right resources starts here.',
    hero_sub:'Trusted local and national resources to help survivors access housing, legal aid, counseling, and emergency services.',
    browse:'Browse All Resources',speak:'Speak With an Advocate',
    danger:'🚨 In immediate danger?',
    danger_detail:'Call 911 · National DV Hotline: 1-800-799-7233 · Crisis Text: Text HOME to 741741',
    categories:'Resource Categories',categories_sub:'Browse by the type of support you need.',
    featured:'Featured Resources',featured_sub:'Frequently shared by our advocates.',
    all_resources:'All Resources',search_placeholder:'Search resources…',all:'All',
    no_results:'No resources found.',share:'Share',download:'Download',visit_link:'Visit Link',
    contact_title:'Speak with an Advocate',
    contact_sub:'Confidential and judgment-free support. Reach out by any of the methods below.',
    privacy_title:'Your privacy is protected.',
    privacy_body:'All communications are confidential. We will never share your information without explicit consent, except as required by law in situations of immediate danger.',
    nav_home:'Home',nav_resources:'Resources',nav_contact:'Contact',
    resources_label:(n)=>`${n} resource${n!==1?'s':''} available`,
    footer_tag:'Supporting survivors across Colorado.',
    share_resource:'Share Resource',email_tab:'📧 Email',text_tab:'💬 Text',link_tab:'🔗 Link',
    email_label:"Enter the recipient's email to open a pre-filled message.",
    text_label:'Enter a phone number to open a pre-filled SMS with the resource link.',
    link_label:'Copy this link to share the resource directly.',
    open_email:'Open in Email Client',open_text:'Open in Messages',copy:'Copy',copied:'✓ Copied',
  },
  es: {
    tagline:'Red de Defensa de Víctimas de Colorado',hero_label:'No Estás Solo/a',
    hero_title:'Encontrar los recursos correctos comienza aquí.',
    hero_sub:'Recursos locales y nacionales de confianza para ayudar a los sobrevivientes a acceder a vivienda, asistencia legal, consejería y servicios de emergencia.',
    browse:'Ver Todos los Recursos',speak:'Hablar con un Defensor',
    danger:'🚨 ¿En peligro inmediato?',
    danger_detail:'Llame al 911 · Línea Nacional DV: 1-800-799-7233 · Texto de Crisis: Envía HOLA al 741741',
    categories:'Categorías de Recursos',categories_sub:'Busque por el tipo de apoyo que necesita.',
    featured:'Recursos Destacados',featured_sub:'Compartidos frecuentemente por nuestros defensores.',
    all_resources:'Todos los Recursos',search_placeholder:'Buscar recursos…',all:'Todos',
    no_results:'No se encontraron recursos.',share:'Compartir',download:'Descargar',visit_link:'Visitar Enlace',
    contact_title:'Hablar con un Defensor',
    contact_sub:'Apoyo confidencial y sin prejuicios. Contáctenos por cualquiera de los métodos a continuación.',
    privacy_title:'Su privacidad está protegida.',
    privacy_body:'Todas las comunicaciones son confidenciales. Nunca compartiremos su información sin consentimiento explícito, excepto según lo exija la ley en situaciones de peligro inmediato.',
    nav_home:'Inicio',nav_resources:'Recursos',nav_contact:'Contacto',
    resources_label:(n)=>`${n} recurso${n!==1?'s':''} disponible${n!==1?'s':''}`,
    footer_tag:'Apoyando a sobrevivientes en todo Colorado.',
    share_resource:'Compartir Recurso',email_tab:'📧 Correo',text_tab:'💬 Texto',link_tab:'🔗 Enlace',
    email_label:'Ingrese el correo del destinatario para abrir un mensaje pre-llenado.',
    text_label:'Ingrese un número de teléfono para abrir un SMS pre-llenado con el enlace.',
    link_label:'Copie este enlace para compartir el recurso directamente.',
    open_email:'Abrir en Correo',open_text:'Abrir en Mensajes',copy:'Copiar',copied:'✓ Copiado',
  }
}

const CAT_LABELS = {
  en:{ housing:'Housing & Shelter',legal:'Legal Aid',counseling:'Counseling & Mental Health',financial:'Financial Assistance',safety:'Safety Planning',children:'Children & Families',medical:'Medical & Health',emergency:'Crisis & Emergency' },
  es:{ housing:'Vivienda y Refugio',legal:'Asistencia Legal',counseling:'Consejería y Salud Mental',financial:'Asistencia Financiera',safety:'Plan de Seguridad',children:'Niños y Familias',medical:'Médico y Salud',emergency:'Crisis y Emergencias' }
}

function getCategoryBg(id){const m={housing:'#E1F5EE',legal:'#E6F1FB',counseling:'#EEEDFE',financial:'#EAF3DE',safety:'#FAECE7',children:'#FBEAF0',medical:'#E6F1FB',emergency:'#FCEBEB'};return m[id]||'#F1EFE8'}
function buildShareLink(b){return `${window.location.origin}/brochures/${b.id}`}
function emailBrochure(b,email=''){const link=b.link_url||buildShareLink(b);const s=encodeURIComponent(`Resource: ${b.title}`);const body=encodeURIComponent(`Hello,\n\nI wanted to share this resource:\n\n${b.title}\n${b.description||''}\n\nLink: ${link}\n\nShared by your victim advocate.`);window.open(`mailto:${email}?subject=${s}&body=${body}`,'_blank')}
function textBrochure(b,phone=''){const link=b.link_url||buildShareLink(b);const msg=encodeURIComponent(`Resource from your advocate: "${b.title}" — ${link}`);window.open(`sms:${phone}?body=${msg}`,'_blank')}
async function logShare(id,method){await supabase.from('share_logs').insert({brochure_id:id,method})}
function isAdmin(){return window.location.pathname.startsWith('/admin')}

const Badge=({label,color='#1B4D8E',bg='#E6F1FB'})=><span style={{fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:20,background:bg,color,letterSpacing:'0.03em',whiteSpace:'nowrap'}}>{label}</span>

function Btn({children,onClick,variant='primary',small,disabled,style={}}){
  const v={primary:{background:'#1B4D8E',color:'#fff',border:'none'},secondary:{background:'transparent',color:'#1B4D8E',border:'1.5px solid #1B4D8E'},danger:{background:'#A32D2D',color:'#fff',border:'none'},ghost:{background:'transparent',color:'#5F5E5A',border:'1.5px solid #D3D1C7'},success:{background:'#0F6E56',color:'#fff',border:'none'}}
  return <button onClick={onClick} disabled={disabled} style={{...v[variant],padding:small?'5px 14px':'9px 22px',borderRadius:8,fontSize:small?12:14,fontWeight:600,cursor:disabled?'not-allowed':'pointer',opacity:disabled?0.5:1,fontFamily:'Georgia,serif',...style}} onMouseEnter={e=>{if(!disabled)e.currentTarget.style.opacity='0.82'}} onMouseLeave={e=>{if(!disabled)e.currentTarget.style.opacity='1'}}>{children}</button>
}

const Field=({label,children})=><div><label style={{fontSize:11,fontWeight:700,color:'#5F5E5A',display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'0.06em'}}>{label}</label>{children}</div>
const inp={width:'100%',padding:'9px 12px',borderRadius:8,border:'1.5px solid #D3D1C7',fontSize:14,fontFamily:'Georgia,serif',outline:'none',boxSizing:'border-box',background:'var(--color-background-primary)',color:'var(--color-text-primary)'}
const Input=({value,onChange,placeholder,type='text',style={}})=><input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{...inp,...style}}/>
const Textarea=({value,onChange,placeholder,rows=3})=><textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{...inp,resize:'vertical',lineHeight:1.6}}/>
const SelectEl=({value,onChange,options})=><select value={value} onChange={e=>onChange(e.target.value)} style={inp}>{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>
const Spinner=()=><div style={{display:'inline-block',width:18,height:18,border:'2px solid #D3D1C7',borderTopColor:'#1B4D8E',borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/>

function ColoradoLogo({size=40}){
  return <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="20" fill="rgba(255,255,255,0.15)"/>
    <polygon points="6,29 15,13 24,29" fill="rgba(255,255,255,0.85)"/>
    <polygon points="15,29 24,9 33,29" fill="#fff"/>
    <polygon points="15,13 17.5,18 12.5,18" fill="rgba(180,220,255,0.8)"/>
    <polygon points="24,9 27,15 21,15" fill="rgba(180,220,255,0.9)"/>
    <path d="M20 35C20 35 12 29 12 23.5C12 20.5 14.5 18.5 17 19.5C18.2 20 20 21.5 20 21.5C20 21.5 21.8 20 23 19.5C25.5 18.5 28 20.5 28 23.5C28 29 20 35 20 35Z" fill="rgba(255,200,80,0.9)"/>
  </svg>
}

function ShareModal({brochure,onClose,lang}){
  const t=T[lang]
  const[tab,setTab]=useState('email')
  const[email,setEmail]=useState('')
  const[phone,setPhone]=useState('')
  const[copied,setCopied]=useState(false)
  const link=brochure.link_url||buildShareLink(brochure)
  async function copy(){try{await navigator.clipboard.writeText(link)}catch{}setCopied(true);setTimeout(()=>setCopied(false),2000);logShare(brochure.id,'link')}
  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div style={{background:'var(--color-background-primary)',borderRadius:16,padding:28,width:'100%',maxWidth:460}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
          <div><h3 style={{margin:0,fontSize:18,fontFamily:'Georgia,serif',color:'#1B4D8E'}}>{t.share_resource}</h3><p style={{margin:'4px 0 0',fontSize:13,color:'#888780'}}>{brochure.title}</p></div>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',fontSize:22,color:'#888780'}}>×</button>
        </div>
        <div style={{display:'flex',gap:8,marginBottom:20}}>
          {['email','text','link'].map(t2=><button key={t2} onClick={()=>setTab(t2)} style={{flex:1,padding:'7px 0',borderRadius:8,border:'1.5px solid',borderColor:tab===t2?'#1B4D8E':'#D3D1C7',background:tab===t2?'#E6F1FB':'transparent',color:tab===t2?'#1B4D8E':'#888780',fontWeight:600,fontSize:13,cursor:'pointer'}}>{t2==='email'?t.email_tab:t2==='text'?t.text_tab:t.link_tab}</button>)}
        </div>
        {tab==='email'&&<div><p style={{fontSize:13,color:'#5F5E5A',marginTop:0}}>{t.email_label}</p><Input value={email} onChange={setEmail} placeholder="recipient@email.com" type="email" style={{marginBottom:12}}/><Btn style={{width:'100%'}} onClick={()=>{emailBrochure(brochure,email);logShare(brochure.id,'email')}}>{t.open_email}</Btn></div>}
        {tab==='text'&&<div><p style={{fontSize:13,color:'#5F5E5A',marginTop:0}}>{t.text_label}</p><Input value={phone} onChange={setPhone} placeholder="+1 (970) 555-0100" type="tel" style={{marginBottom:12}}/><Btn style={{width:'100%'}} onClick={()=>{textBrochure(brochure,phone);logShare(brochure.id,'sms')}}>{t.open_text}</Btn></div>}
        {tab==='link'&&<div><p style={{fontSize:13,color:'#5F5E5A',marginTop:0}}>{t.link_label}</p><div style={{display:'flex',gap:8}}><input readOnly value={link} style={{flex:1,padding:'9px 12px',borderRadius:8,border:'1.5px solid #D3D1C7',fontSize:12,fontFamily:'monospace',background:'#F1EFE8',color:'#444441'}}/><Btn variant={copied?'success':'ghost'} small onClick={copy}>{copied?t.copied:t.copy}</Btn></div></div>}
      </div>
    </div>
  )
}

function BrochureCard({brochure,categories,onShare,lang}){
  const t=T[lang]
  const cat=categories.find(c=>c.id===brochure.category_id)
  const catLabel=CAT_LABELS[lang]?.[brochure.category_id]||cat?.label||brochure.category_id
  async function download(){const{data}=supabase.storage.from('brochures').getPublicUrl(brochure.file_path);window.open(data.publicUrl,'_blank')}
  return(
    <div style={{background:'var(--color-background-primary)',borderRadius:14,border:'1px solid #D3D1C7',padding:20,display:'flex',flexDirection:'column',gap:12,transition:'box-shadow .2s'}} onMouseEnter={e=>e.currentTarget.style.boxShadow='0 4px 20px rgba(0,0,0,.08)'} onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8}}>
        <div style={{flex:1}}>
          <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:8}}>
            {cat&&<Badge label={`${cat.icon} ${catLabel}`} color={cat.color} bg={getCategoryBg(brochure.category_id)}/>}
            {brochure.featured&&<Badge label="⭐ Featured" color="#BA7517" bg="#FAEEDA"/>}
          </div>
          <h3 style={{margin:0,fontSize:15,fontFamily:'Georgia,serif',fontWeight:700,color:'var(--color-text-primary)',lineHeight:1.4}}>{brochure.title}</h3>
        </div>
        <div style={{fontSize:28,flexShrink:0}}>📄</div>
      </div>
      {brochure.description&&<p style={{margin:0,fontSize:13,color:'var(--color-text-secondary)',lineHeight:1.6}}>{brochure.description}</p>}
      {brochure.link_url&&<a href={brochure.link_url} target="_blank" rel="noreferrer" style={{fontSize:13,color:'#1B4D8E',textDecoration:'none',display:'flex',alignItems:'center',gap:6}}>🔗 <span style={{textDecoration:'underline',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:260}}>{brochure.link_url}</span></a>}
      <div style={{display:'flex',flexWrap:'wrap',gap:4}}>{(brochure.tags||[]).map(tag=><span key={tag} style={{fontSize:11,padding:'2px 8px',borderRadius:20,background:'#F1EFE8',color:'#5F5E5A'}}>{tag}</span>)}</div>
      <div style={{borderTop:'1px solid #F1EFE8',paddingTop:12,display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8}}>
        <span style={{fontSize:11,color:'#888780'}}>{brochure.file_name} · {brochure.file_size} · {brochure.created_at?.split('T')[0]}</span>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <Btn small variant="ghost" onClick={()=>onShare(brochure)}>{t.share}</Btn>
          {brochure.link_url&&<Btn small variant="secondary" onClick={()=>window.open(brochure.link_url,'_blank')}>{t.visit_link}</Btn>}
          {brochure.file_path&&brochure.file_path.length>2&&<Btn small variant="secondary" onClick={download}>{t.download}</Btn>}
        </div>
      </div>
    </div>
  )
}

function BrochureForm({categories,initial={},onDone,onCancel}){
  const editing=!!initial.id
  const[title,setTitle]=useState(initial.title||'')
  const[description,setDescription]=useState(initial.description||'')
  const[categoryId,setCategoryId]=useState(initial.category_id||categories[0]?.id||'')
  const[tags,setTags]=useState((initial.tags||[]).join(', '))
  const[featured,setFeatured]=useState(initial.featured||false)
  const[linkUrl,setLinkUrl]=useState(initial.link_url||'')
  const[file,setFile]=useState(null)
  const[dragOver,setDragOver]=useState(false)
  const[uploading,setUploading]=useState(false)
  const[error,setError]=useState('')
  const fileRef=useRef()

  async function submit(){
    if(!title.trim())return setError('Title is required.')
    if(!categoryId)return setError('Category is required.')
    if(!editing&&!file&&!linkUrl)return setError('Please upload a file or provide a link.')
    setError('');setUploading(true)
    try{
      let filePath=initial.file_path||'',fileName=initial.file_name||'—',fileSize=initial.file_size||'—',fileType=initial.file_type||'—'
      if(file){
        const ext=file.name.split('.').pop()
        filePath=`${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const{error:se}=await supabase.storage.from('brochures').upload(filePath,file,{contentType:file.type})
        if(se)throw se
        fileName=file.name;fileSize=`${(file.size/1024/1024).toFixed(1)} MB`;fileType=ext
      }
      const payload={title:title.trim(),description:description.trim(),category_id:categoryId,tags:tags.split(',').map(t=>t.trim()).filter(Boolean),featured,link_url:linkUrl.trim()||null,file_name:fileName,file_path:filePath,file_size:fileSize,file_type:fileType,updated_at:new Date().toISOString()}
      let data,err
      if(editing){({data,error:err}=await supabase.from('brochures').update(payload).eq('id',initial.id).select().single())}
      else{({data,error:err}=await supabase.from('brochures').insert(payload).select().single())}
      if(err)throw err
      onDone(data,editing)
    }catch(e){setError(e.message||'Operation failed.')}finally{setUploading(false)}
  }

  return(
    <div style={{background:'var(--color-background-primary)',borderRadius:14,border:'1px solid #D3D1C7',padding:28}}>
      <h3 style={{margin:'0 0 24px',fontFamily:'Georgia,serif',fontSize:20,color:'#1B4D8E'}}>{editing?'✏️ Edit Brochure':'📤 Add New Brochure'}</h3>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
        <div style={{gridColumn:'1/-1'}}><Field label="Title *"><Input value={title} onChange={setTitle} placeholder="Brochure title…"/></Field></div>
        <Field label="Category *"><SelectEl value={categoryId} onChange={setCategoryId} options={categories.map(c=>({value:c.id,label:`${c.icon} ${c.label}`}))}/></Field>
        <Field label="Tags (comma-separated)"><Input value={tags} onChange={setTags} placeholder="housing, shelter, emergency"/></Field>
        <div style={{gridColumn:'1/-1'}}><Field label="Description"><Textarea value={description} onChange={setDescription} placeholder="Brief description of what this resource covers…"/></Field></div>
        <div style={{gridColumn:'1/-1'}}>
          <Field label="External Link URL"><Input value={linkUrl} onChange={setLinkUrl} type="url" placeholder="https://example.gov/resource.pdf"/></Field>
          <p style={{margin:'6px 0 0',fontSize:12,color:'#888780'}}>If this resource lives at an external URL, paste it here. Visitors will see a clickable link on the card.</p>
        </div>
      </div>
      <div onDragOver={e=>{e.preventDefault();setDragOver(true)}} onDragLeave={()=>setDragOver(false)} onDrop={e=>{e.preventDefault();setDragOver(false);setFile(e.dataTransfer.files[0])}} onClick={()=>fileRef.current.click()} style={{border:`2px dashed ${dragOver?'#1B4D8E':'#B4B2A9'}`,borderRadius:12,padding:28,textAlign:'center',cursor:'pointer',background:dragOver?'#E6F1FB':'var(--color-background-secondary)',transition:'all .2s',marginBottom:16}}>
        <div style={{fontSize:28,marginBottom:8}}>📎</div>
        <div style={{fontWeight:600,color:'var(--color-text-primary)',marginBottom:4}}>{file?`✅ ${file.name}`:editing?'Drop new file to replace, or leave empty to keep existing':'Drop file here or click to browse'}</div>
        <div style={{fontSize:12,color:'#888780'}}>PDF, DOCX, PNG, JPG — max 50 MB</div>
        <input ref={fileRef} type="file" accept=".pdf,.docx,.png,.jpg,.jpeg" style={{display:'none'}} onChange={e=>setFile(e.target.files[0])}/>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20}}>
        <input type="checkbox" id="featured" checked={featured} onChange={e=>setFeatured(e.target.checked)} style={{width:16,height:16,cursor:'pointer'}}/>
        <label htmlFor="featured" style={{fontSize:14,cursor:'pointer',color:'var(--color-text-primary)'}}>Mark as featured resource</label>
      </div>
      {error&&<p style={{color:'#A32D2D',fontSize:13,marginBottom:12}}>{error}</p>}
      <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
        <Btn variant="ghost" onClick={onCancel} disabled={uploading}>Cancel</Btn>
        <Btn onClick={submit} disabled={uploading}>{uploading?<span style={{display:'flex',alignItems:'center',gap:8}}><Spinner/>{editing?'Saving…':'Uploading…'}</span>:editing?'Save Changes':'Upload Brochure'}</Btn>
      </div>
    </div>
  )
}

function PublicPortal({brochures,categories,onShare}){
  const[lang,setLang]=useState('en')
  const[activeCat,setActiveCat]=useState('all')
  const[search,setSearch]=useState('')
  const[page,setPage]=useState('home')
  const t=T[lang]
  const filtered=brochures.filter(b=>{const matchCat=activeCat==='all'||b.category_id===activeCat;const q=search.toLowerCase();return matchCat&&(!q||b.title.toLowerCase().includes(q)||(b.description||'').toLowerCase().includes(q)||(b.tags||[]).some(tag=>tag.toLowerCase().includes(q)))})
  return(
    <div style={{fontFamily:'Georgia,serif',background:'var(--color-background-tertiary)',minHeight:'100vh'}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <header style={{background:'linear-gradient(135deg,#1B3A6B 0%,#1B4D8E 100%)',padding:'0 32px'}}>
        <div style={{maxWidth:1100,margin:'0 auto',display:'flex',justifyContent:'space-between',alignItems:'center',height:68}}>
          <div style={{display:'flex',alignItems:'center',gap:14,cursor:'pointer'}} onClick={()=>setPage('home')}>
            <ColoradoLogo size={44}/>
            <div><div style={{color:'#fff',fontWeight:700,fontSize:17}}>Colorado Victim Resources</div><div style={{color:'rgba(255,255,255,.65)',fontSize:11}}>{t.tagline}</div></div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <nav style={{display:'flex',gap:4}}>{[['home',t.nav_home],['resources',t.nav_resources],['contact',t.nav_contact]].map(([id,label])=><button key={id} onClick={()=>setPage(id)} style={{background:page===id?'rgba(255,255,255,.15)':'transparent',border:'none',color:'#fff',padding:'6px 14px',borderRadius:8,fontSize:13,fontWeight:page===id?600:400,cursor:'pointer',fontFamily:'Georgia,serif'}}>{label}</button>)}</nav>
            <div style={{display:'flex',borderRadius:8,overflow:'hidden',border:'1px solid rgba(255,255,255,.3)',marginLeft:8}}>{['en','es'].map(l=><button key={l} onClick={()=>setLang(l)} style={{padding:'5px 12px',background:lang===l?'rgba(255,255,255,.25)':'transparent',border:'none',color:'#fff',fontWeight:lang===l?700:400,fontSize:12,cursor:'pointer',fontFamily:'Georgia,serif'}}>{l.toUpperCase()}</button>)}</div>
          </div>
        </div>
      </header>

      {page==='home'&&<>
        <section style={{background:'linear-gradient(160deg,#0F2D5E 0%,#1B4D8E 60%,#2563A8 100%)',padding:'72px 32px 64px'}}>
          <div style={{maxWidth:720,margin:'0 auto',textAlign:'center'}}>
            <div style={{display:'inline-block',background:'rgba(255,255,255,.12)',borderRadius:20,padding:'5px 18px',fontSize:12,color:'rgba(255,255,255,.9)',marginBottom:20,letterSpacing:'0.08em',textTransform:'uppercase'}}>{t.hero_label}</div>
            <h1 style={{color:'#fff',fontSize:40,fontWeight:700,margin:'0 0 16px',lineHeight:1.25}}>{t.hero_title}</h1>
            <p style={{color:'rgba(255,255,255,.82)',fontSize:17,lineHeight:1.7,margin:'0 0 32px'}}>{t.hero_sub}</p>
            <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}>
              <Btn onClick={()=>setPage('resources')} style={{background:'#fff',color:'#1B4D8E',padding:'12px 28px',fontSize:15}}>{t.browse}</Btn>
              <Btn onClick={()=>setPage('contact')} variant="ghost" style={{borderColor:'rgba(255,255,255,.5)',color:'#fff',padding:'12px 28px',fontSize:15}}>{t.speak}</Btn>
            </div>
          </div>
        </section>
        <div style={{background:'#A32D2D',padding:'12px 32px'}}><div style={{maxWidth:1100,margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'center',gap:12,flexWrap:'wrap'}}><span style={{color:'#fff',fontWeight:700,fontSize:14}}>{t.danger}</span><span style={{color:'rgba(255,255,255,.9)',fontSize:14}}>{t.danger_detail}</span></div></div>
        <section style={{padding:'56px 32px',maxWidth:1100,margin:'0 auto'}}>
          <h2 style={{fontSize:28,fontWeight:700,margin:'0 0 8px',color:'var(--color-text-primary)'}}>{t.categories}</h2>
          <p style={{color:'var(--color-text-secondary)',margin:'0 0 32px',fontSize:15}}>{t.categories_sub}</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:16}}>
            {categories.map(cat=>{const count=brochures.filter(b=>b.category_id===cat.id).length;const label=CAT_LABELS[lang]?.[cat.id]||cat.label;return <div key={cat.id} onClick={()=>{setActiveCat(cat.id);setPage('resources')}} style={{background:'var(--color-background-primary)',borderRadius:14,border:'1px solid #D3D1C7',padding:20,cursor:'pointer',transition:'all .2s'}} onMouseEnter={e=>{e.currentTarget.style.borderColor=cat.color;e.currentTarget.style.transform='translateY(-2px)'}} onMouseLeave={e=>{e.currentTarget.style.borderColor='#D3D1C7';e.currentTarget.style.transform='none'}}><div style={{fontSize:28,marginBottom:10}}>{cat.icon}</div><div style={{fontWeight:700,fontSize:14,color:'var(--color-text-primary)',marginBottom:4}}>{label}</div><div style={{fontSize:12,color:'#888780'}}>{count} {lang==='es'?'recurso':'resource'}{count!==1?'s':''}</div></div>})}
          </div>
        </section>
        {brochures.filter(b=>b.featured).length>0&&<section style={{padding:'0 32px 56px',maxWidth:1100,margin:'0 auto'}}>
          <h2 style={{fontSize:28,fontWeight:700,margin:'0 0 8px',color:'var(--color-text-primary)'}}>{t.featured}</h2>
          <p style={{color:'var(--color-text-secondary)',margin:'0 0 32px',fontSize:15}}>{t.featured_sub}</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:20}}>{brochures.filter(b=>b.featured).map(b=><BrochureCard key={b.id} brochure={b} categories={categories} onShare={onShare} lang={lang}/>)}</div>
        </section>}
      </>}

      {page==='resources'&&<div style={{maxWidth:1100,margin:'0 auto',padding:'40px 32px'}}>
        <h2 style={{fontSize:32,fontWeight:700,margin:'0 0 8px',color:'var(--color-text-primary)'}}>{t.all_resources}</h2>
        <p style={{color:'var(--color-text-secondary)',margin:'0 0 24px'}}>{t.resources_label(filtered.length)}</p>
        <div style={{display:'flex',gap:12,marginBottom:24,flexWrap:'wrap'}}>
          <div style={{flex:1,minWidth:220}}><Input value={search} onChange={setSearch} placeholder={t.search_placeholder}/></div>
          <div style={{display:'flex',flexWrap:'wrap',gap:8}}>{[{id:'all',label:t.all,icon:''},...categories].map(cat=>{const label=cat.id!=='all'?(CAT_LABELS[lang]?.[cat.id]||cat.label):cat.label;return <button key={cat.id} onClick={()=>setActiveCat(cat.id)} style={{padding:'7px 14px',borderRadius:20,fontSize:13,cursor:'pointer',border:'1.5px solid',fontFamily:'Georgia,serif',borderColor:activeCat===cat.id?(cat.color||'#1B4D8E'):'#D3D1C7',background:activeCat===cat.id?getCategoryBg(cat.id):'transparent',color:activeCat===cat.id?(cat.color||'#1B4D8E'):'#888780',fontWeight:activeCat===cat.id?600:400}}>{cat.icon} {label}</button>})}</div>
        </div>
        {filtered.length===0?<div style={{textAlign:'center',padding:'60px 0',color:'#888780'}}><div style={{fontSize:48,marginBottom:12}}>🔍</div><div>{t.no_results}</div></div>:<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:20}}>{filtered.map(b=><BrochureCard key={b.id} brochure={b} categories={categories} onShare={onShare} lang={lang}/>)}</div>}
      </div>}

      {page==='contact'&&<div style={{maxWidth:800,margin:'0 auto',padding:'56px 32px'}}>
        <h2 style={{fontSize:32,fontWeight:700,margin:'0 0 8px',color:'var(--color-text-primary)'}}>{t.contact_title}</h2>
        <p style={{color:'var(--color-text-secondary)',margin:'0 0 36px',fontSize:16,lineHeight:1.7}}>{t.contact_sub}</p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:20,marginBottom:40}}>
          {[{icon:'📞',label:lang==='es'?'Teléfono':'Phone',detail:'(970) 555-0100',note:lang==='es'?'Lun–Vie, 8am–6pm':'Mon–Fri, 8am–6pm'},{icon:'💬',label:lang==='es'?'Línea de Crisis':'Crisis Line',detail:'1-800-799-7233',note:'24/7'},{icon:'✉️',label:lang==='es'?'Correo':'Email',detail:'help@covictims.org',note:lang==='es'?'Respuesta en 24 horas':'Within 24 hours'},{icon:'📍',label:lang==='es'?'Oficina':'Walk-in',detail:'123 Main St, Loveland CO',note:lang==='es'?'Cita preferida':'Appointment preferred'}].map(c=><div key={c.label} style={{background:'var(--color-background-primary)',borderRadius:14,border:'1px solid #D3D1C7',padding:20}}><div style={{fontSize:28,marginBottom:10}}>{c.icon}</div><div style={{fontWeight:700,fontSize:11,color:'#888780',marginBottom:4,textTransform:'uppercase',letterSpacing:'0.05em'}}>{c.label}</div><div style={{fontWeight:700,fontSize:14,color:'var(--color-text-primary)',marginBottom:4}}>{c.detail}</div><div style={{fontSize:12,color:'#888780'}}>{c.note}</div></div>)}
        </div>
        <div style={{background:'#E6F1FB',borderRadius:14,padding:24,borderLeft:'4px solid #1B4D8E'}}><h3 style={{margin:'0 0 8px',color:'#0F2D5E'}}>{t.privacy_title}</h3><p style={{margin:0,color:'#1B4D8E',fontSize:14,lineHeight:1.7}}>{t.privacy_body}</p></div>
      </div>}

      <footer style={{background:'#0F2D5E',padding:32,marginTop:48}}>
        <div style={{maxWidth:1100,margin:'0 auto',display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:16,alignItems:'center'}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}><ColoradoLogo size={32}/><div><div style={{color:'#fff',fontWeight:700}}>Colorado Victim Resources</div><div style={{color:'rgba(255,255,255,.55)',fontSize:12}}>{t.footer_tag}</div></div></div>
          <div style={{color:'rgba(255,255,255,.55)',fontSize:12,textAlign:'right'}}><div>Emergency: 911</div><div>DV Hotline: 1-800-799-7233</div></div>
        </div>
      </footer>
    </div>
  )
}

function AdminLogin({onLogin}){
  const[email,setEmail]=useState('')
  const[password,setPassword]=useState('')
  const[loading,setLoading]=useState(false)
  const[error,setError]=useState('')
  async function signIn(){if(!email||!password)return setError('Email and password are required.');setLoading(true);setError('');const{error:err}=await supabase.auth.signInWithPassword({email,password});if(err){setError(err.message);setLoading(false)}else onLogin()}
  return(
    <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#0F2D5E,#1B4D8E)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Georgia,serif',padding:16}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{background:'var(--color-background-primary)',borderRadius:20,padding:40,width:'100%',maxWidth:380}}>
        <div style={{textAlign:'center',marginBottom:32}}><div style={{display:'flex',justifyContent:'center',marginBottom:12}}><div style={{background:'#1B4D8E',borderRadius:50,padding:10}}><ColoradoLogo size={40}/></div></div><h2 style={{margin:0,fontSize:22,color:'#1B4D8E'}}>Admin Sign In</h2><p style={{margin:'8px 0 0',color:'#888780',fontSize:14}}>Colorado Victim Resources — Staff Portal</p></div>
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <Field label="Email"><Input value={email} onChange={setEmail} type="email" placeholder="admin@covictims.org"/></Field>
          <Field label="Password"><Input value={password} onChange={setPassword} type="password" placeholder="••••••••"/></Field>
          {error&&<p style={{color:'#A32D2D',fontSize:13,margin:0}}>{error}</p>}
          <Btn onClick={signIn} disabled={loading} style={{width:'100%',marginTop:4,background:'#1B4D8E'}}>{loading?<span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8}}><Spinner/>Signing in…</span>:'Sign In'}</Btn>
        </div>
        <p style={{textAlign:'center',marginTop:20,fontSize:12,color:'#888780'}}>Create accounts in Supabase → Authentication → Users</p>
      </div>
    </div>
  )
}

function AdminPanel({brochures,setBrochures,categories,setCategories,onLogout,onShare}){
  const[view,setView]=useState('dashboard')
  const[showForm,setShowForm]=useState(false)
  const[editTarget,setEditTarget]=useState(null)
  const[shareLogs,setShareLogs]=useState([])
  const[newCatName,setNewCatName]=useState('')
  const[newCatIcon,setNewCatIcon]=useState('📌')
  const[newCatColor,setNewCatColor]=useState('#1B4D8E')
  const[catError,setCatError]=useState('')
  useEffect(()=>{if(view==='activity'){supabase.from('share_logs').select('*, brochures(title)').order('shared_at',{ascending:false}).limit(30).then(({data})=>setShareLogs(data||[]))}},[view])
  function handleFormDone(data,wasEditing){if(wasEditing)setBrochures(prev=>prev.map(b=>b.id===data.id?data:b));else setBrochures(prev=>[data,...prev]);setShowForm(false);setEditTarget(null)}
  async function handleDelete(brochure){if(!window.confirm(`Delete "${brochure.title}"?`))return;if(brochure.file_path&&brochure.file_path.length>2)await supabase.storage.from('brochures').remove([brochure.file_path]);await supabase.from('brochures').delete().eq('id',brochure.id);setBrochures(prev=>prev.filter(b=>b.id!==brochure.id))}
  async function handleToggleFeatured(brochure){const{data}=await supabase.from('brochures').update({featured:!brochure.featured}).eq('id',brochure.id).select().single();if(data)setBrochures(prev=>prev.map(b=>b.id===data.id?data:b))}
  async function addCategory(){if(!newCatName.trim())return setCatError('Name is required.');const id=newCatName.toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'');const{data,error}=await supabase.from('categories').insert({id,label:newCatName,icon:newCatIcon,color:newCatColor}).select().single();if(error)return setCatError(error.message);setCategories(prev=>[...prev,data]);setNewCatName('');setNewCatIcon('📌');setCatError('')}
  const stats={total:brochures.length,featured:brochures.filter(b=>b.featured).length,categories:categories.length,shares:shareLogs.length}
  return(
    <div style={{fontFamily:'Georgia,serif',background:'var(--color-background-tertiary)',minHeight:'100vh'}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <header style={{background:'linear-gradient(135deg,#0F2D5E,#1B4D8E)',padding:'0 32px'}}>
        <div style={{maxWidth:1200,margin:'0 auto',display:'flex',justifyContent:'space-between',alignItems:'center',height:60}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}><ColoradoLogo size={32}/><div style={{color:'#fff',fontWeight:700,fontSize:16}}>CVR Admin Portal</div><span style={{background:'rgba(255,255,255,.15)',color:'#B5D4F4',fontSize:11,padding:'2px 10px',borderRadius:10,fontWeight:600}}>Staff</span></div>
          <div style={{display:'flex',gap:4}}>
            {[['dashboard','Dashboard'],['brochures','Brochures'],['categories','Categories'],['activity','Activity']].map(([id,label])=><button key={id} onClick={()=>setView(id)} style={{background:view===id?'rgba(255,255,255,.15)':'transparent',border:'none',color:'#fff',padding:'6px 14px',borderRadius:8,fontSize:13,fontWeight:view===id?600:400,cursor:'pointer',fontFamily:'Georgia,serif'}}>{label}</button>)}
            <button onClick={onLogout} style={{background:'rgba(163,45,45,.5)',border:'none',color:'#fff',padding:'6px 14px',borderRadius:8,fontSize:13,cursor:'pointer',fontFamily:'Georgia,serif',marginLeft:8}}>Sign Out</button>
          </div>
        </div>
      </header>
      <div style={{maxWidth:1200,margin:'0 auto',padding:32}}>
        {view==='dashboard'&&<>
          <h2 style={{fontSize:28,fontWeight:700,margin:'0 0 24px'}}>Dashboard</h2>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))',gap:16,marginBottom:32}}>
            {[{label:'Total Brochures',value:stats.total,icon:'📄',color:'#1B4D8E'},{label:'Featured',value:stats.featured,icon:'⭐',color:'#BA7517'},{label:'Categories',value:stats.categories,icon:'🗂️',color:'#0F6E56'},{label:'Share Events',value:stats.shares,icon:'📤',color:'#533AB7'}].map(s=><div key={s.label} style={{background:'var(--color-background-primary)',borderRadius:12,border:'1px solid #D3D1C7',padding:'18px 20px'}}><div style={{fontSize:24,marginBottom:8}}>{s.icon}</div><div style={{fontSize:28,fontWeight:700,color:s.color,marginBottom:4}}>{s.value}</div><div style={{fontSize:11,color:'#888780',textTransform:'uppercase',letterSpacing:'0.05em'}}>{s.label}</div></div>)}
          </div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}><h3 style={{margin:0,fontSize:18}}>Recent Uploads</h3><Btn small onClick={()=>{setView('brochures');setShowForm(true);setEditTarget(null)}}>+ Add Brochure</Btn></div>
          <div style={{background:'var(--color-background-primary)',borderRadius:12,border:'1px solid #D3D1C7',overflow:'hidden'}}>
            {brochures.slice(0,6).map((b,i)=>{const cat=categories.find(c=>c.id===b.category_id);return <div key={b.id} style={{padding:'14px 20px',borderBottom:i<5?'1px solid #F1EFE8':'none',display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}><div style={{flex:1}}><div style={{fontWeight:600,fontSize:14,color:'var(--color-text-primary)'}}>{b.title}</div><div style={{fontSize:12,color:'#888780',marginTop:2}}>{cat?.label||b.category_id} · {b.created_at?.split('T')[0]}</div></div><div style={{display:'flex',gap:8}}>{b.featured&&<Badge label="Featured" color="#BA7517" bg="#FAEEDA"/>}<Btn small variant="ghost" onClick={()=>{setEditTarget(b);setShowForm(true);setView('brochures')}}>Edit</Btn><Btn small variant="ghost" onClick={()=>onShare(b)}>Share</Btn></div></div>})}
          </div>
        </>}
        {view==='brochures'&&<>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}><h2 style={{fontSize:28,fontWeight:700,margin:0}}>Manage Brochures</h2><Btn onClick={()=>{setShowForm(!showForm);setEditTarget(null)}}>{showForm?'Cancel':'+ Add Brochure'}</Btn></div>
          {showForm&&<div style={{marginBottom:28}}><BrochureForm categories={categories} initial={editTarget||{}} onDone={handleFormDone} onCancel={()=>{setShowForm(false);setEditTarget(null)}}/></div>}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:20}}>
            {brochures.map(b=><div key={b.id}><BrochureCard brochure={b} categories={categories} onShare={onShare} lang="en"/><div style={{marginTop:8,display:'flex',gap:12,paddingLeft:4}}><button onClick={()=>{setEditTarget(b);setShowForm(true);window.scrollTo(0,0)}} style={{background:'none',border:'none',cursor:'pointer',fontSize:12,color:'#1B4D8E',fontFamily:'Georgia,serif'}}>✏️ Edit</button><button onClick={()=>handleToggleFeatured(b)} style={{background:'none',border:'none',cursor:'pointer',fontSize:12,color:b.featured?'#BA7517':'#888780',fontFamily:'Georgia,serif'}}>{b.featured?'★ Unfeature':'☆ Feature'}</button><button onClick={()=>handleDelete(b)} style={{background:'none',border:'none',cursor:'pointer',fontSize:12,color:'#A32D2D',fontFamily:'Georgia,serif'}}>🗑 Delete</button></div></div>)}
          </div>
        </>}
        {view==='categories'&&<>
          <h2 style={{fontSize:28,fontWeight:700,margin:'0 0 24px'}}>Manage Categories</h2>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(230px,1fr))',gap:16,marginBottom:32}}>{categories.map(cat=>{const count=brochures.filter(b=>b.category_id===cat.id).length;return <div key={cat.id} style={{background:'var(--color-background-primary)',borderRadius:12,border:'1px solid #D3D1C7',padding:18}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}><div style={{fontSize:28}}>{cat.icon}</div><Badge label={`${count} resources`} color="#5F5E5A" bg="#F1EFE8"/></div><div style={{fontWeight:700,fontSize:15,marginTop:10,color:'var(--color-text-primary)'}}>{cat.label}</div><div style={{marginTop:8,width:24,height:4,borderRadius:2,background:cat.color}}/></div>})}</div>
          <div style={{background:'var(--color-background-primary)',borderRadius:12,border:'1px solid #D3D1C7',padding:24}}>
            <h3 style={{margin:'0 0 16px',fontSize:16}}>Add New Category</h3>
            <div style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'flex-end'}}>
              <div style={{width:72}}><Field label="Icon"><Input value={newCatIcon} onChange={setNewCatIcon} placeholder="📌"/></Field></div>
              <div style={{flex:1,minWidth:160}}><Field label="Name"><Input value={newCatName} onChange={setNewCatName} placeholder="Category name…"/></Field></div>
              <div style={{width:52}}><Field label="Color"><input type="color" value={newCatColor} onChange={e=>setNewCatColor(e.target.value)} style={{width:52,height:38,borderRadius:8,border:'1.5px solid #D3D1C7',cursor:'pointer',padding:2}}/></Field></div>
              <Btn onClick={addCategory}>Add</Btn>
            </div>
            {catError&&<p style={{color:'#A32D2D',fontSize:13,marginTop:10}}>{catError}</p>}
          </div>
        </>}
        {view==='activity'&&<>
          <h2 style={{fontSize:28,fontWeight:700,margin:'0 0 24px'}}>Share Activity</h2>
          <div style={{background:'var(--color-background-primary)',borderRadius:12,border:'1px solid #D3D1C7',overflow:'hidden'}}>
            {shareLogs.length===0?<div style={{padding:40,textAlign:'center',color:'#888780'}}>No share activity yet.</div>:shareLogs.map((log,i)=><div key={log.id} style={{padding:'12px 20px',borderBottom:i<shareLogs.length-1?'1px solid #F1EFE8':'none',display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}><div><div style={{fontWeight:600,fontSize:14}}>{log.brochures?.title||'Unknown'}</div><div style={{fontSize:12,color:'#888780',marginTop:2}}>{new Date(log.shared_at).toLocaleString()}</div></div><Badge label={log.method==='email'?'📧 Email':log.method==='sms'?'💬 SMS':'🔗 Link'} color={log.method==='email'?'#1B4D8E':log.method==='sms'?'#533AB7':'#0F6E56'} bg={log.method==='email'?'#E6F1FB':log.method==='sms'?'#EEEDFE':'#E1F5EE'}/></div>)}
          </div>
        </>}
      </div>
    </div>
  )
}

export default function App(){
  const[session,setSession]=useState(null)
  const[brochures,setBrochures]=useState([])
  const[categories,setCategories]=useState([])
  const[loading,setLoading]=useState(true)
  const[shareTarget,setShareTarget]=useState(null)
  const[lang]=useState('en')
  const admin=isAdmin()
  useEffect(()=>{supabase.auth.getSession().then(({data:{session}})=>setSession(session));const{data:{subscription}}=supabase.auth.onAuthStateChange((_e,s)=>setSession(s));return()=>subscription.unsubscribe()},[])
  useEffect(()=>{Promise.all([supabase.from('categories').select('*').order('sort_order'),supabase.from('brochures').select('*').order('created_at',{ascending:false})]).then(([{data:cats},{data:bros}])=>{setCategories(cats||[]);setBrochures(bros||[]);setLoading(false)})},[])
  async function handleLogout(){await supabase.auth.signOut();setSession(null)}
  if(loading)return <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',fontFamily:'Georgia,serif',flexDirection:'column',gap:16,color:'#1B4D8E'}}><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style><div style={{width:36,height:36,border:'3px solid #D3D1C7',borderTopColor:'#1B4D8E',borderRadius:'50%',animation:'spin 0.7s linear infinite'}}/><span>Loading resources…</span></div>
  return <>
    {shareTarget&&<ShareModal brochure={shareTarget} onClose={()=>setShareTarget(null)} lang={lang}/>}
    {admin?(session?<AdminPanel brochures={brochures} setBrochures={setBrochures} categories={categories} setCategories={setCategories} onLogout={handleLogout} onShare={setShareTarget}/>:<AdminLogin onLogin={()=>{}}/>):<PublicPortal brochures={brochures} categories={categories} onShare={setShareTarget}/>}
  </>
}
