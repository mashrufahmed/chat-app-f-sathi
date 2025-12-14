// Helper function returning boolean
const isFriendStatus = (
  requestData: string,
  friendStatus: string,
  check: 'pending' | 'accepted' | 'rejected'
) => {
  const status = requestData || friendStatus || 'none';
  return status === check;
};

export default isFriendStatus;