const Mainlayout = ({ children }) => {
  // Redirect to Onboarding if user is not onboarded
  return (
    <div className='container mx-auto mt-24 mb-20'>{children}</div>
  );
};

export default Mainlayout;
