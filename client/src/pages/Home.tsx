import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// components
import { PageContainer } from "@/components";

// date
import { DateTime } from "luxon";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";

// utils
import { backendAPI, setErrorMessage } from "@/utils";



const Home = () => {

  const dispatch = useContext(GlobalDispatchContext);
  const {hasSetupBackend } = useContext(GlobalStateContext);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [areButtonsDisabled, setAreButtonsDisabled] = useState(false);
  const [title, setTitle] = useState("");                         // stores title of toast
  const [message, setMessage] = useState("");                     // stores message of toast
  const [scheduledDateTime, setScheduledDateTime] = useState(""); // stores date and time
  const [successMessage, setSuccessMessage] = useState("");       // Success message state
  const [isAdminLoading, setIsAdminLoading] = useState(true);     // track loading state for admin check
  // for error states
  const [titleError, setTitleError] = useState("");
  const [messageError, setMessageError] = useState("");
  const [scheduleError, setScheduleError] = useState("");
  // character limits
  const TITLE_CHAR_LIMIT = 40;
  const MESSAGE_CHAR_LIMIT = 140;

  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const navigate = useNavigate();


  // Fetches visitor immediately to determine whether the user is an admin or not
  useEffect(() => {
    if (!hasSetupBackend || isAdmin != null) return; // Does not fetch until backend is setup

    // Fetches isAdmin attribute
    const fetchVisitor = async () => {
      try {
        const response = await backendAPI.get("/visitor");
        if (response.data.success) {
          setIsAdmin(response.data.visitor.isAdmin);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Visitor fetch error:", error);
        setIsAdmin(null);         // Stays neutral on error
      } finally {
        setIsAdminLoading(false);
      }
    };
  
    fetchVisitor();
  }, [hasSetupBackend, isAdmin]); // re-runs whenever hasSetupBackend changes to ensure that the admins can still see the correct view


  // Function to fire a toast immediately
  const handleFireToast = async () => {
    setAreButtonsDisabled(true);
    let error = false;
    
    // Checks if title/message is missing or if they are over character limit
    if(!title){
      setTitleError("Please enter a title before sending immediately.");
      error = true;
    }else if(title.length > TITLE_CHAR_LIMIT){
      setTitleError(`Title must be ${TITLE_CHAR_LIMIT} characters or less`);
      error = true;
    }else{
      setTitleError("");
    }

    if(!message){
      setMessageError("Please enter a message before sending immediately.");
      error = true;
    }else if(message.length > MESSAGE_CHAR_LIMIT){
      setMessageError(`Title must be ${MESSAGE_CHAR_LIMIT} characters or less`);
      error = true;
    }else{
      setMessageError("");
    }

    // returns if there is an error
    if(error){
      setSuccessMessage("");
      setScheduleError("");
      setAreButtonsDisabled(false);
      return;
    }
    setSuccessMessage("");    
    
    // calls the fireToast function
    backendAPI
      .post("/world/fire-toast", {  // firing toast immediately
        title: title, 
        text: message, 
      })
      .then(() => {
        setSuccessMessage("Toast fired!");
        // clear any previous errors
        setMessageError("");
        setTitleError("");  
        setTitle("");
        setMessage("");
        setScheduledDateTime(""); 
      })
      .catch((error) => setErrorMessage(dispatch, error))
      .finally(() => {
        setAreButtonsDisabled(false);
      });
  };


  // function to schedule toast - Currently not in use while scheduling is not available
  const handleScheduleSend = async () => {
    // time variables to keep track of the entered time, pst transaltion, and minimum valid time
    const selectedTime = DateTime.fromISO(scheduledDateTime);
    const pacificTime = selectedTime.setZone("America/Los_Angeles");
    const now = DateTime.now();
    const minValidTime = now.plus({ minutes: 4 });  // 4 minute buffer for scheduling times
    let error = false;

    // Checks if title/message/scheduledTime is missing or if they are over character limit
    if(!title){
      setTitleError("Please enter a title before scheduling.");
      error = true;
    }else if(title.length > TITLE_CHAR_LIMIT){
      setTitleError(`Title must be ${TITLE_CHAR_LIMIT} characters or less`);
      error = true;
    }else{
      setTitleError("");
    }

    if(!message){
      setMessageError("Please enter a message before scheduling.");
      error = true;
    }else if(message.length > MESSAGE_CHAR_LIMIT){
      setMessageError(`Title must be ${MESSAGE_CHAR_LIMIT} characters or less`);
      error = true;
    }else{
      setMessageError("");
    }

    if(!selectedTime.isValid){
      setScheduleError("Please enter a date before scheduling.");
      error = true
    }else if(selectedTime <= minValidTime) {  
      setScheduleError("Please select a future date and time that is at least 5 minutes ahead.");
      error = true
    }else{
      setScheduleError("");
    }

    // returns if there is an error
    if(error){
      setSuccessMessage("");
      setAreButtonsDisabled(false);
      return;
    }

    setSuccessMessage(""); // Clear previous success message
    backendAPI
      .post("/world/handle-schedule-toast",{  // scheduling toast
        title: title,
        message: message,
        date_scheduled: pacificTime,
      })
      .then(() =>{
        setMessageError("");
        setTitleError("");
        setScheduleError(""); // clear any previous error
        setSuccessMessage("Notification Scheduled! "); // Set success message
        setTitle("");
        setMessage("");
        setScheduledDateTime("");
        setShowDateTimePicker(false);
      })
      .catch((error) => setErrorMessage(dispatch, error))
      .finally(() => {
        setAreButtonsDisabled(false);
      })
  };

  

  // Loading animation while backend is not setup
  if (isAdminLoading || !hasSetupBackend) {
    return <PageContainer isLoading={true}><div>Loading...</div></PageContainer>;
  }
  
  // non-admin view shows no functionality
  if (!isAdmin) {
    return <div className="text-center text-gray-500 mt-12">
      <p className="text-lg font-medium mb-2">Nothing to see here!</p>
    </div>
  }
  
  return (
    <PageContainer isLoading={isLoading}>
      <div className="px-6 md:px-12">
        <h1 className="text-2xl font-bold mb-6">Send a Notification to Users</h1>
  
        {/* Title textfield */}
        <div className="mb-6">
          <label htmlFor="titleInput" className="block text-lg font-medium mb-1">Notification Title</label>
          <input
            id="titleInput"
            type="text"
            value={title}
            //maxLength={TITLE_CHAR_LIMIT}
            onChange={(e) => setTitle(e.target.value)}
            className={`border p-2 rounded-md w-full ${titleError ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Ex. Class is Ending"
          />
          {titleError && <div className="text-red-500 text-sm mt-1">{titleError}</div>}
          <div
            className={`text-sm text-right mt-1 ${
              title.length > TITLE_CHAR_LIMIT ? "text-red-500" : "text-black-600"
            }`}
          >
            {title.length}/{TITLE_CHAR_LIMIT}
          </div>
        </div>
  
        {/* Message textfield */}
        <div className="mb-6">
          <label htmlFor="messageInput" className="block text-lg font-medium mb-1">Notification Message</label>
          <textarea
            id="messageInput"
            value={message}
            //maxLength={MESSAGE_CHAR_LIMIT}
            onChange={(e) => setMessage(e.target.value)}
            className={`border p-2 rounded-md w-full ${messageError ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Ex. Please be ready to leave in 5 minutes!"
          />
          {messageError && <div className="text-red-500 text-sm mt-1">{messageError}</div>}
          <div
            className={`text-sm text-right mt-1 ${
              message.length > MESSAGE_CHAR_LIMIT ? "text-red-500" : "text-black-600"
            }`}
          >
            {message.length}/{MESSAGE_CHAR_LIMIT}
          </div>
        </div>
  

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <button
            className="btn"
            disabled={areButtonsDisabled}
            onClick={handleFireToast}
          >
            Send Now
          </button>
          {/* Hiding the Schedule Send button, remove false to put it back in the UI */}
          {false && <button
            className="btn"
            disabled={areButtonsDisabled}
            onClick={() => setShowDateTimePicker(true)}
          >
            Schedule Send
          </button>}
          {/* Hiding the View Scheduled Messages button, remove false to put it back in the UI */}
          {false && 
          <button
            className="text-[#001F3F] border border-[#001F3F] hover:bg-[#001F3F]/10 font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
            onClick={() => navigate("/scheduled-messages")}
          >
            View Scheduled Messages
          </button>}
        </div>
  
        {/* Opens scheduling functionality when the user clicks the Schedule Send Button - Hiden for now */}
        {showDateTimePicker && (
          <div className="mb-6">
            <label htmlFor="scheduleInput" className="block text-lg font-medium mb-1">Schedule a Date & Time</label>
            <input
              id="scheduleInput"
              type="datetime-local"
              value={scheduledDateTime}
              onChange={(e) => setScheduledDateTime(e.target.value)}
              className={`border p-2 rounded-md w-full ${scheduleError ? 'border-red-500' : 'border-gray-300'}`}
            />
            {scheduleError && <div className="text-red-500 text-sm mt-1">{scheduleError}</div>}
            {scheduledDateTime && (
              <p className="text-sm mt-2">Scheduled for: <strong>{new Date(scheduledDateTime).toLocaleString()}</strong></p>
            )}
            <div className="mt-3">
              <button
                className="btn"
                onClick={handleScheduleSend}
              >
                Confirm Schedule
              </button>
            </div>
          </div>
        )}
  

        {successMessage && (
          <div className="mt-6 font-semibold text-center">{successMessage}</div>
        )}
      </div>
    </PageContainer>
  );
};

export default Home;
