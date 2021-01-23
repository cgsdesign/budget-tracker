//-----------------------C- Create
// create variable to hold db connection
let db;
// establish a connection to IndexedDB database called 'temp_transaction' and set it to version 1
const request = indexedDB.open('temp_transaction', 1);

// this event will emit if the database version changes (nonexistant to version 1, v1 to v2, etc.)
request.onupgradeneeded = function(event) {
    // save a reference to the database 
    const db = event.target.result;
    // create an object store (table) called `new_temptran`, set it to have an auto incrementing primary key of sorts 
    db.createObjectStore('new_temptran', { autoIncrement: true });
  };

  //-----------------------R- Read
// upon a successful 
request.onsuccess = function(event) {
    // when db is successfully created with its object store (from onupgradedneeded event above) or simply established a connection, save reference to db in global variable
    db = event.target.result;
  
    // check if app is online, if yes run uploadPizza() function to send all local db data to api
    if (navigator.onLine) {
      // we haven't created this yet, but we will soon, so let's comment it out for now
        uploadTransaction();
    }
  };
  
  request.onerror = function(event) {
    // log error here
    console.log(event.target.errorCode);
  };

//-----------------------U- Update
  // This function will be executed if we attempt to submit a new transactions and there's no internet connection
function saveRecord(record) {
    //transaction below is importsnt as we are not always hooked to normal db
    // open a new transaction with the database with read and write permissions 
    const transaction = db.transaction(['new_temptran'], 'readwrite');
  
    // access the object store for `new_temptran`
    const pizzaObjectStore = transaction.objectStore('new_temptran');
  
    // add record to your store with add method
    pizzaObjectStore.add(record);
  }

//posting to MongoDB server
  function uploadTransaction() {
    // open a transaction on your db
    const transaction = db.transaction(['new_temptran'], 'readwrite');
  
    // access your object store
    const pizzaObjectStore = transaction.objectStore('new_temptran');
  
    // get all records from store and set to a variable
    const getAll = pizzaObjectStore.getAll();
  
 // upon a successful .getAll() execution, run this function
    getAll.onsuccess = function() {
        // if there was data in indexedDb's store, let's send it to the api server
        if (getAll.result.length > 0) {
        fetch('api/transaction/bulk', {
            method: 'POST',
            body: JSON.stringify(getAll.result),
            headers: {
            Accept: 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
            }
        })
            .then(response => response.json())
            .then(serverResponse => {
            if (serverResponse.message) {
                throw new Error(serverResponse);
            }
            // open one more transaction
            const transaction = db.transaction(['new_temptran'], 'readwrite');
            // access the new_temptran object store
            const pizzaObjectStore = transaction.objectStore('new_temptran');
            // clear all items in your store(so you dont resave every time)
            pizzaObjectStore.clear();//-------!!! ask about testing clearing

            alert('All saved transactions have been submitted!');
            })
            .catch(err => {
            console.log(err);
            });
        }
    };
  }



  // listen for app coming back online
window.addEventListener('online', uploadTransaction);