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

    describe("deliver", () => {
        it("reverts if caller is not owner", async () => {
            const [deployer, aloe, beni] = await ethers.getSigners();
            const amount = 4;
            await expect(
                contract.connect(aloe).deliver(aloe.address, amount),
                "Reverts if caller is not owner"
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
        it("reverts if ticketId does not exist", async () => {
            const [deployer, aloe, beni] = await ethers.getSigners();
            const amount = 4;
            await expect(
                contract.deliver(aloe.address, amount),
                "Reverts before ticket id is added"
            ).to.be.revertedWith("NTT: Ticket does not exist");
        });
        it("increases quantityHeldBy of holder", async () => {
            const [deployer, aloe, beni] = await ethers.getSigners();

            let quantity = await contract.quantityHeldBy(aloe.address);
            expect(
                quantity.toString(),
                "Quantity starts at 0 before delivery"
            ).to.equal("0");

            const amount = 1;
            let tx = await contract.addTickets(amount);
            await tx.wait();
            tx = await contract.deliver(aloe.address, amount);
            await tx.wait();

            quantity = await contract.quantityHeldBy(aloe.address);
            expect(
                quantity.toString(),
                "Quantity increases by amount delivered"
            ).to.equal(amount.toString());
        });
        it("assigns `holder` for `ticketId`", async () => {
            const [deployer, aloe, beni] = await ethers.getSigners();

            const amount = 11;
            let tx = await contract.addTickets(amount);
            await tx.wait();
            tx = await contract.deliver(beni.address, amount);
            await tx.wait();

            for (let index = 1; index < amount + 1; index++) {
                const holder = await contract.holderOf(index);
                expect(
                    holder,
                    "Ticket holder is Beni"
                ).to.equal(beni.address);
            }
        });
    });
});
