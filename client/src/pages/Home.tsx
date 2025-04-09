import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// components
import { PageContainer } from "@/components";



// context
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";

// utils
import { backendAPI, setErrorMessage } from "@/utils";
//import { getWorldDataObject, World } from '../utils/index.js';
//const defaultDroppedAsset = { assetName: "", bottomLayerURL: "", id: null, topLayerURL: null };



const Home = () => {

  const dispatch = useContext(GlobalDispatchContext);
  const {hasSetupBackend } = useContext(GlobalStateContext);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const { visitor } = useContext(GlobalStateContext);
  const [isLoading, setIsLoading] = useState(false);
  const [areButtonsDisabled, setAreButtonsDisabled] = useState(false);
  const [title, setTitle] = useState(""); // stores title of toast
  const [message, setMessage] = useState(""); // stores message of toast
  const [scheduledDateTime, setScheduledDateTime] = useState(""); // stores date and time
  const [successMessage, setSuccessMessage] = useState(""); // Success message state
  const [isAdminLoading, setIsAdminLoading] = useState(true); // Track loading state for admin check
  const navigate = useNavigate();

  // useeffect 
  // Fetch visitor info on mount
  useEffect(() => {
    if (!hasSetupBackend) return; // Don't fetch until backend is setup
  
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
        setIsAdmin(null); // Stay neutral on error
      } finally {
        setIsLoading(false);
        setIsAdminLoading(false);
      }
    };
  
    fetchVisitor();
  }, [hasSetupBackend]); // The effect will re-run whenever `hasSetupBackend` changes


  // function to fire toast immediately
  const handleFireToast = async () => {
    setAreButtonsDisabled(true);
    if (!title || !message ) {
      alert("Please enter a title and message before sending immediately.");  // error checking
      setAreButtonsDisabled(false);
      return;
    }
    backendAPI
      .post("/world/fire-toast", {  // firing toast immediately
        title: title, 
        text: message, 
      })
      .then(() => {
        console.log("Toast fired successfully"); // debugging
      })
      .catch((error) => setErrorMessage(dispatch, error))
      .finally(() => {
        setAreButtonsDisabled(false);
      });
  };

  // function to schedule toast
  const handleScheduleSend = async () => {
    if (!title || !message || !scheduledDateTime) {
      alert("Please enter a title, message, and scheduled date before scheduling.");  // error checking
      setAreButtonsDisabled(false);
      return;
    }
    setSuccessMessage(""); // Clear previous success message
    backendAPI
      .post("/world/handle-schedule-toast",{  // scheduling toast
        title: title,
        message: message,
        date_scheduled: scheduledDateTime,
      })
      .then(() =>{
        console.log("Notification scheduled!");  // debugging
        setSuccessMessage("Notification Scheduled! "); // Set success message
      })
      .catch((error) => setErrorMessage(dispatch, error))
      .finally(() => {
        setAreButtonsDisabled(false);
      })  
  };

  


  if (isAdminLoading || !hasSetupBackend) {
    return <PageContainer isLoading={true}><div>Loading...</div></PageContainer>;
  }
  
  if (!isAdmin) {
    // not an admin — hide the admin-only content
    return <div>You are not authorized to view this page.</div>;
  }
  
  

  return (
    <PageContainer isLoading={isLoading}>
      <>  
        <h1 className="h2">Send a Notification to Users</h1>
        {/* textbox input */}
        <div className="my-4">
          <label htmlFor="titleInput" className="block text-lg font-medium">Enter Notification Title:</label>
          <input
            id="titleInput"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border border-gray-300 p-2 rounded-md w-full"
            placeholder=""
          />
        </div>
        <div className="my-4">
          <label htmlFor="messageInput" className="block text-lg font-small">Enter Notification Message:</label>
          <input
            id="messageInput"
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="border border-gray-300 p-2 rounded-md w-full"
            placeholder=""
          />
        </div>
        {/* buttons */}
        <div className="flex gap-4 p-4">
            <button className="btn" disabled={areButtonsDisabled} onClick={handleFireToast}>
              Send Now
            </button>
        </div>
        {/* shows calender to schedule */}
          <div className="my-4">
            <label htmlFor="scheduleInput" className="block text-lg font-medium">Schedule a Date & Time:</label>
            <input
              id="scheduleInput"
              type="datetime-local"
              value={scheduledDateTime}
              onChange={(e) => setScheduledDateTime(e.target.value)}
              className="border border-gray-300 p-2 rounded-md w-full"
            />
          </div>

        {/* show the scheduled date & time */}
        {scheduledDateTime && (
          <p className="mt-2"><strong>Scheduled for:</strong> {new Date(scheduledDateTime).toLocaleString()}</p>
        )}
        <div className="flex gap-4 p-4">
            <button className="btn" disabled={areButtonsDisabled} onClick={handleScheduleSend}>
              Schedule Send
            </button>
        </div>
        <div>
          <button className="btn" onClick={() => navigate("/scheduled-messages")}>
            View Scheduled Messages
          </button>
        </div>
        {/* Success Message */}
        {successMessage && (
          <div className="mt-6 flex justify-center">
            <p className="font-semibold rounded-md px-4 py-2 text-center w-fit">
              {successMessage}
            </p>
          </div>
        )}

      </>
    </PageContainer>
  );
};

export default Home;
