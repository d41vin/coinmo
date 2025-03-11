pragma solidity ^0.8.0;

contract BillSplitter {
    address public creator;
    uint256 public totalBillAmount;
    address public tokenAddress; // Address of the ERC-20 token, if applicable
    address payable[] public participants;
    mapping(address => uint256) public amountDue; // How much each participant owes (if unequal split)
    mapping(address => bool) public hasPaid; // Track who has paid
    bool public billSettled = false;

    event ParticipantAdded(address participant);
    event BillAmountSet(uint256 amount);
    event PaymentReceived(address payer, uint256 amount);
    event Withdrawal(address recipient, uint256 amount);

    constructor() {
        creator = msg.sender;
    }

    modifier onlyCreator() {
        require(
            msg.sender == creator,
            "Only the creator can call this function."
        );
        _;
    }

    modifier billNotSettled() {
        require(!billSettled, "Bill has already been settled.");
        _;
    }

    function addParticipant(
        address payable _participant
    ) external onlyCreator billNotSettled {
        participants.push(_participant);
        emit ParticipantAdded(_participant);
    }

    function setBillAmount(
        uint256 _totalBillAmount
    ) external onlyCreator billNotSettled {
        totalBillAmount = _totalBillAmount;
        emit BillAmountSet(_totalBillAmount);
    }

    function pay() external payable billNotSettled {
        require(msg.value > 0, "Payment must be greater than 0.");
        require(!hasPaid[msg.sender], "You have already paid.");

        uint256 amountOwed = totalBillAmount / participants.length; // Simple equal split
        require(msg.value >= amountOwed, "Insufficient payment.");

        hasPaid[msg.sender] = true;
        emit PaymentReceived(msg.sender, msg.value);

        // Handle refunds for overpayment (optional)
        if (msg.value > amountOwed) {
            payable(msg.sender).transfer(msg.value - amountOwed);
        }
    }

    function withdraw() external onlyCreator billNotSettled {
        // Check if everyone has paid
        uint256 totalCollected = address(this).balance;
        uint256 expectedTotal = totalBillAmount;

        require(
            totalCollected >= expectedTotal,
            "Not all participants have paid."
        );

        billSettled = true;
        payable(creator).transfer(totalCollected);
        emit Withdrawal(creator, totalCollected);
    }
}
