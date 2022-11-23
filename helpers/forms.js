exports.parseOnly = (fields) => {

  for(let key in fields){ (fields[key] = JSON.parse(fields[key]) ) } 
  
  return fields
  
}