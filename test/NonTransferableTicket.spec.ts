import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { formatEther, parseEther } from "@ethersproject/units";
import { BigNumber } from "@ethersproject/bignumber";

describe("NonTransferableTicket", () => {
    let contract: Contract;

    const ticketCollectionName = "DojaCat Wvman Tickets";

    beforeEach(async () => {
        const [issuer] = await ethers.getSigners();
        const Contract = await ethers.getContractFactory("NonTransferableTicket");
        contract = await Contract.deploy(ticketCollectionName, issuer.address);
    });

    it("sets name and issuer", async () => {
        const [deployer] = await ethers.getSigners();
        const name = await contract.name();
        const issuer = await contract.issuer();
        expect(name, "Name is set upon deploy").to.equal(ticketCollectionName);
        expect(issuer, "Issuer is set upon deploy").to.equal(deployer.address);
    });

    describe("addTickets", () => {
        it("reverts if caller is not owner", async () => {
            const [deployer, aloe, beni] = await ethers.getSigners();
            const amount = 4;
            await expect(
                contract.connect(aloe).addTickets(amount),
                "Reverts when caller is not owner"
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
        it("increases totalRemaining by amount", async () => {
            const [deployer, aloe, beni] = await ethers.getSigners();

            let remaining = await contract.totalRemaining();
            expect(
                remaining.toString(),
                "Remaining starts at 0 before we add tickets"
            ).to.equal("0");

            const amount = 4;
            await contract.addTickets(amount);
            remaining = await contract.totalRemaining();
            expect(
                remaining.toString(),
                "Remaining is equal to amount added because we started at 0"
            ).to.equal(amount.toString());
        });
    });

    describe("issue", () => {
        it("increases ticketsIssu", async () => {
            const [deployer, aloe, beni] = await ethers.getSigners();
            expect(
                true,
                "Message"
            ).to.be.false;
            await expect(
                true,
                "Message"
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });
});
