import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { formatEther, parseEther } from "@ethersproject/units";
import { BigNumber } from "@ethersproject/bignumber";

describe("NonTransferableTicket::Gas", () => {
    let contract: Contract;

    const ticketCollectionName = "DojaCat Wvman Tickets";

    beforeEach(async () => {
        const [issuer] = await ethers.getSigners();
        const Contract = await ethers.getContractFactory("NonTransferableTicket");
        contract = await Contract.deploy(ticketCollectionName, issuer.address);
    });

    it("addTickets(1)", async () => {
        console.log("addTickets(1)");
        let gasUsed = BigNumber.from(0);
        const [deployer] = await ethers.getSigners();
        const tx = await contract.addTickets(1);
        const receipt = await tx.wait();
        gasUsed = gasUsed.add(receipt.gasUsed);
        console.log("gasUsed", gasUsed.toString());
    });

    it("addTickets(1), deliver(to, 1)", async () => {
        console.log("addTickets(1), deliver(to, 1)");
        let gasUsed = BigNumber.from(0);
        const [deployer] = await ethers.getSigners();

        let tx = await contract.addTickets(1);
        let receipt = await tx.wait();
        gasUsed = gasUsed.add(receipt.gasUsed);

        tx = await contract.deliver(deployer.address, 1);
        receipt = await tx.wait();
        gasUsed = gasUsed.add(receipt.gasUsed);

        console.log("gasUsed", gasUsed.toString());
    });

   it("addTicketsAndDeliver(to, 1)", async () => {
        console.log("addTicketsAndDeliver(to, 1)");
        let gasUsed = BigNumber.from(0);
        const [deployer] = await ethers.getSigners();
        let tx = await contract.addTicketsAndDeliver(deployer.address, 1);
        let receipt = await tx.wait();
        gasUsed = gasUsed.add(receipt.gasUsed);
        console.log("gasUsed", receipt.gasUsed.toString());
    });
});
