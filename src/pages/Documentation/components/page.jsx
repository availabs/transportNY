import React, {useEffect} from 'react'
import { NavLink, Link, useSubmit, useNavigate, useParams} from "react-router-dom";
import Nav from './nav'
import { PageControls } from './page-controls'

const theme = {
  page: {
    container: 'flex-1 max-w-3xl mx-auto w-full h-full ',
    content: '',
  }
}


export function PageView ({item, dataItems, attributes}) {
  if(!item) return <div> No Pages </div>

  const ContentView = attributes['docs-content'].ViewComp

  return (
    <div className='flex flex-1 h-full w-full'>
      <Nav dataItems={dataItems} />
      <div className='border flex-1 bg-white flex'>
        <div className={theme.page.container}>
          <div className='p-6 text-4xl font-semibold'>
            {item['title']} 
          </div>
          
          <div className='text-base font-light leading-7'>
            <ContentView 
              value={item['docs-content']} 
              {...attributes['docs-content']}
            />
          </div>
        </div>
         
      </div>
      <PageControls />
    </div>    
  ) 
}


export function PageEdit ({item, dataItems, updateAttribute ,attributes, setItem, status}) {
  const navigate = useNavigate()
  //if(!dataItems[0]) return <div/>
  
  React.useEffect(() => {
    if(!item?.url_slug ) { 
      //console.log('navigate', item, item.id,dataItems[0].id)
      let defaultUrl = dataItems
        .sort((a,b) => a.index-b.index)
        .filter(d=> !d.parent && d.url_slug)[0]
      //console.log('defaultUrl', defaultUrl)
      defaultUrl && defaultUrl.url_slug && navigate(`edit/${defaultUrl.url_slug}`)
    }
  },[])

  const ContentEdit = attributes['docs-content'].EditComp
  const TitleEdit = attributes['title'].EditComp

  return (
    <div className='flex flex-1 h-full w-full'>
      <Nav dataItems={dataItems} edit={true} />
      <div className='border flex-1 bg-white flex '>
        <div className={theme.page.container}>
          {/*{status ? <div>{JSON.stringify(status)}</div> : ''}*/}
          <div className='p-6 text-4xl font-semibold'>
            <TitleEdit 
              value={item['title']}
              onChange={(v) => updateAttribute('title', v)}  
              className='w-full'      
              {...attributes['title']}
            />
          </div>
          <div className='text-base font-light leading-7'>
            <ContentEdit
              value={item['docs-content']} 
              onChange={(v) => updateAttribute('docs-content', v)}        
              {...attributes['docs-content']}
            />
          </div>
        </div>
      </div>
      <PageControls 
        item={item} 
        dataItems={dataItems}
        edit={true}
        status={status}
      />
    </div>   
  ) 
}


