// This function is the endpoint's request handler.
//{ query, headers, body}, response
exports = async function({ query, headers, body}, response) {
  const {user} = query;
  var uid;
  const lmax = 20;
  /*
  if (Number.isInteger(Number(user))) {
    uid = Number(user);
  } else {
    uid = user;
  }*/
  uid = user;
  const mdb = context.services.get("BgmPostDB");
  const db = mdb.db("topics");
  const collection = db.collection("group_topics");

  function getDate() {
    const date = new Date();
    let day = date.getDate();
    let month = date.getMonth() + 1;
    if (month<10) {
      month = "0" + month;
    }
    if (day<10) {
      month = "0" + month;
    }
    let year = date.getFullYear() - 3; // latest 3 years
    return `${year}-${month}-${day}`;
  }
  
  const condition = {
    "poster": uid,
    "lastpost" : { $gt : getDate() },
  };
  const projection = {
    "_id" : 0,
    "poster": 0,
  };
  
  const sort_condition = {
    "lastpost" : -1,
  };
  var ret = await collection.find(condition, projection).sort(sort_condition).limit(lmax).toArray();
  return ret;
};