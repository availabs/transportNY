export const getDomain = (host) => {
    // ---
    // takes window.location.host and returns domain
    // only works with single depth subdomains 
    // ---
	return host.split('.').length > 2 ?
    window.location.host.split('.').slice(1).join('.') : 
    host.split('.').length > 1 ?  
    	window.location.host.split('.')[1].toLowerCase() :  
    	window.location.host.split('.')[0].toLowerCase()
}

export const getSubdomain = (host) => {
    // ---
    // takes window.location.host and returns subdomain
    // only works with single depth subdomains 
    // ---
    return host.split('.').length > 2 ?
    window.location.host.split('.')[0].toLowerCase() : 
    host.split('.').length > 1 ?  
        window.location.host.split('.')[0].toLowerCase() :  
        false
}