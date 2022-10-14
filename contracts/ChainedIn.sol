// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.8;

contract ChainedIn {
    struct Company {
        uint256 id;
        string name;
        address walletAddress;
        uint256[] currentEmployees;
        uint256[] previousEmployees;
        uint256[] requestedEmployees;
    }

    struct User {
        uint256 id;
        uint256 companyId;
        uint256 numSkill;
        string name;
        address walletAddress;
        bool isEmployed;
        bool isManager;
        uint256[] skills;
        uint256[] experiences;
    }

    struct Experience {
        string startingDate;
        string endingDate;
        string role;
        bool isActive;
        bool isApproved;
        uint256 companyId;
    }

    struct Certificate {
        uint256 id;
        string url;
        string issuedOn;
        string validTill;
        string name;
        string issuer;
    }

    struct Endorsement {
        uint256 endorserId;
        string date;
        string comment;
    }

    struct Skill {
        uint256 id;
        string name;
        bool isVerified;
        uint256[] certifications;
        uint256[] endorsements;
    }

    error ChainedIn__UserExists();
    error ChainedIn__AuthenticationFailed();
    error ChainedIn__Unauthorized();
    error ChainedIn__UnauthorizedApprover();
    error ChainedIn__MustBeCompany();
    error ChainedIn__EmployeeNotInCompany();
    error ChainedIn__EmployeeAlreadyManager();

    Company[] public companies;
    User[] public employees;
    Certificate[] public certifications;
    Endorsement[] public endorsements;
    Skill[] public skills;
    Experience[] public experiences;

    mapping(string => address) public emailToAddress;
    mapping(address => uint256) public addressToId;
    mapping(address => bool) public isCompany;

    constructor() {
        User storage johnDoe = employees.push();
        johnDoe.name = "John Doe";
        johnDoe.walletAddress = msg.sender;
        johnDoe.id = 0;
        johnDoe.skills = new uint256[](0);
        johnDoe.experiences = new uint256[](0);
    }

    function signUp(
        string calldata email,
        string calldata name,
        string calldata accountType
    ) external {
        if (emailToAddress[email] != address(0)) {
            revert ChainedIn__UserExists();
        }

        emailToAddress[email] = msg.sender;

        if (compareString(accountType, "user")) {
            User storage user = employees.push();
            user.name = name;
            user.id = employees.length - 1;
            user.walletAddress = msg.sender;
            addressToId[msg.sender] = user.id;
            user.skills = new uint256[](0);
            user.experiences = new uint256[](0);
        } else {
            Company storage company = companies.push();
            company.name = name;
            company.id = companies.length - 1;
            company.walletAddress = msg.sender;
            company.currentEmployees = new uint256[](0);
            company.previousEmployees = new uint256[](0);
            addressToId[msg.sender] = company.id;
            isCompany[msg.sender] = true;
        }
    }

    function login(string calldata email) external view returns (string memory) {
        if (msg.sender != emailToAddress[email]) {
            revert ChainedIn__AuthenticationFailed();
        }

        return isCompany[msg.sender] ? "company" : "user";
    }

    function updateWalletAddress(string calldata email, address newAddress) external {
        if (msg.sender != emailToAddress[email]) {
            revert ChainedIn__AuthenticationFailed();
        }

        emailToAddress[email] = newAddress;
        uint256 id = addressToId[msg.sender];
        addressToId[msg.sender] = 0;
        addressToId[newAddress] = id;
    }

    function addExperience(
        uint256 userId,
        string calldata startingDate,
        string calldata endingDate,
        string calldata role,
        uint256 companyId
    ) external verifiedUser(userId) {
        Experience storage experience = experiences.push();
        experience.companyId = companyId;
        experience.isActive = false;
        experience.isApproved = false;
        experience.startingDate = startingDate;
        experience.role = role;
        experience.endingDate = endingDate;
        employees[userId].experiences.push(experiences.length - 1);
        companies[companyId].requestedEmployees.push(experiences.length - 1);
    }

    function approveExperience(uint256 experienceId, uint256 companyId) external {
        if (
            !((isCompany[msg.sender] &&
                companies[addressToId[msg.sender]].id == experiences[experienceId].companyId) ||
                (employees[addressToId[msg.sender]].isManager &&
                    employees[addressToId[msg.sender]].companyId ==
                    experiences[experienceId].companyId))
        ) {
            revert ChainedIn__UnauthorizedApprover();
        }

        uint256 i;
        experiences[experienceId].isApproved = true;
        for (i = 0; i < companies[companyId].requestedEmployees.length; i++) {
            if (companies[companyId].requestedEmployees[i] == experienceId) {
                companies[companyId].requestedEmployees[i] = 0;
                break;
            }
        }

        for (i = 0; i < companies[companyId].currentEmployees.length; i++) {
            if (companies[companyId].currentEmployees[i] == 0) {
                companies[companyId].requestedEmployees[i] = experienceId;
                break;
            }
        }

        if (i == companies[companyId].currentEmployees.length) {
            companies[companyId].currentEmployees.push(experienceId);
        }
    }

    function approveManager(uint256 employeeId) external {
        if (!isCompany[msg.sender]) {
            revert ChainedIn__MustBeCompany();
        }
        if (!(employees[employeeId].companyId == addressToId[msg.sender])) {
            revert ChainedIn__EmployeeNotInCompany();
        }
        if (employees[employeeId].isManager) {
            revert ChainedIn__EmployeeAlreadyManager();
        }

        employees[employeeId].isManager = true;
    }

    function addSkill(uint256 userId, string calldata skillName) external verifiedUser(userId) {
        Skill storage skill = skills.push();
        employees[userId].skills.push(skills.length - 1);
        skill.name = skillName;
        skill.isVerified = false;
        skill.certifications = new uint256[](0);
        skill.endorsements = new uint256[](0);
    }

    function addCertification(
        uint256 userId,
        string calldata url,
        string memory issuedOn,
        string memory validTill,
        string calldata name,
        string calldata issuer,
        uint256 linkedSkillId
    ) external verifiedUser(userId) {
        Certificate storage certificate = certifications.push();
        certificate.url = url;
        certificate.issuedOn = issuedOn;
        certificate.validTill = validTill;
        certificate.name = name;
        certificate.id = certifications.length - 1;
        certificate.issuer = issuer;
        skills[linkedSkillId].certifications.push(certificate.id);
    }

    function endorseSkill(
        uint256 userId,
        uint256 skillId,
        string calldata date,
        string calldata comment
    ) external {
        Endorsement storage endorsement = endorsements.push();
        endorsement.endorserId = addressToId[msg.sender];
        endorsement.comment = comment;
        endorsement.date = date;
        skills[skillId].endorsements.push(endorsements.length - 1);

        if (employees[addressToId[msg.sender]].isManager) {
            if (employees[addressToId[msg.sender]].companyId == employees[userId].companyId) {
                skills[skillId].isVerified = true;
            }
        }
    }

    function memcmp(bytes memory a, bytes memory b) internal pure returns (bool) {
        return (a.length == b.length) && (keccak256(a) == keccak256(b));
    }

    function compareString(string memory a, string memory b) internal pure returns (bool) {
        return memcmp(bytes(a), bytes(b));
    }

    modifier verifiedUser(uint256 userId) {
        if (userId != addressToId[msg.sender]) {
            revert ChainedIn__Unauthorized();
        }
        _;
    }
}
