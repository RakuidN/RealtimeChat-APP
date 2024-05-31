import Conversations from "./Conversations";
import LogoutButton from "./LogoutButton";
import SearchInput from "./SearchInput";
import { useState } from 'react';
import { useAuthContext } from '../../context/AuthContext';
import axios from 'axios';


const Sidebar = () => {
	const { authUser } = useAuthContext();
	const [status, setStatus] = useState(authUser.status || 'AVAILABLE');
  
	const updateStatus = async (newStatus) => {
	  try {
		await axios.post('/api/users/status', { status: newStatus });
		setStatus(newStatus);
	  } catch (error) {
		console.error('Error updating status: ', error.message);
	  }
	};
  
	return (
	  <div className='border-r border-slate-500 p-4 flex flex-col'>
		<SearchInput />
		<div className='flex justify-between items-center'>
		  <label className='label-text'>Status:</label>
		  <select
			value={status}
			onChange={(e) => updateStatus(e.target.value)}
			className='select select-bordered'
		  >
			<option value='AVAILABLE'>AVAILABLE</option>
			<option value='BUSY'>BUSY</option>
		  </select>
		</div>
		<div className='divider px-3'></div>
		<Conversations />
		<LogoutButton />
	  </div>
	);
  };
  export default Sidebar;

// STARTER CODE FOR THIS FILE
// import Conversations from "./Conversations";
// import LogoutButton from "./LogoutButton";
// import SearchInput from "./SearchInput";

// const Sidebar = () => {
// 	return (
// 		<div className='border-r border-slate-500 p-4 flex flex-col'>
// 			<SearchInput />
// 			<div className='divider px-3'></div>
// 			<Conversations />
// 			<LogoutButton />
// 		</div>
// 	);
// };
// export default Sidebar;
