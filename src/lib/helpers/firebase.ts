/**
 * Get the data to be changed from the request object and handle to return {[key]: value} pairs. 
 * @param REQUEST_DATA: string
 * @return {} Customer! w/ only keys to be changed
 */
export const handleDataToChange = (REQUEST_DATA: any[][]) => {
  let data: {} = {};
  REQUEST_DATA.forEach((v, i) => {
    data = {
      ...data,
      [v[0]]: v[1]
    }
    console.log(v,i);
  });
  return data;

}