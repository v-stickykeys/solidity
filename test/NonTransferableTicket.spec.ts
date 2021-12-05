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

    describe("deliverRedeemable", () => {
        it("reverts if caller is not owner", async () => {
            const [deployer, aloe, beni] = await ethers.getSigners();
            const redeemable = true;
            const amount = 4;
            await expect(
                contract.connect(aloe).deliverRedeemable(aloe.address, amount, redeemable),
                "Reverts if caller is not owner"
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
        it("reverts if ticketId does not exist", async () => {
            const [deployer, aloe, beni] = await ethers.getSigners();
            const redeemable = true;
            const amount = 4;
            await expect(
                contract.deliverRedeemable(aloe.address, amount, redeemable),
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

            const redeemable = true;
            const amount = 1;
            let tx = await contract.addTickets(amount);
            await tx.wait();
            tx = await contract.deliverRedeemable(aloe.address, amount, redeemable);
            await tx.wait();

            quantity = await contract.quantityHeldBy(aloe.address);
            expect(
                quantity.toString(),
                "Quantity increases by amount delivered"
            ).to.equal(amount.toString());
        });
        it("assigns `holder` for `ticketId`", async () => {
            const [deployer, aloe, beni] = await ethers.getSigners();

            const redeemable = true;
            const amount = 11;
            let tx = await contract.addTickets(amount);
            await tx.wait();
            tx = await contract.deliverRedeemable(beni.address, amount, redeemable);
            await tx.wait();

            for (let index = 1; index < amount + 1; index++) {
                const holder = await contract.holderOf(index);
                expect(
                    holder,
                    "Ticket holder is Beni"
                ).to.equal(beni.address);
            }
        });
        it("can make tickets redeemable", async () => {
            const [deployer, aloe, beni] = await ethers.getSigners();

            const redeemable1 = false;
            const amount1 = 11;
            let tx = await contract.addTickets(amount1);
            await tx.wait();
            tx = await contract.deliverRedeemable(beni.address, amount1, redeemable1);
            await tx.wait();

            for (let index = 1; index < amount1 + 1; index++) {
                const isRedeemable = await contract.isRedeemable(index);
                expect(
                    isRedeemable,
                    "False because ticket is not redeemable"
                ).to.be.false;
            }

            const redeemable2 = true;
            const amount2 = 11;
            tx = await contract.addTickets(amount2);
            await tx.wait();
            tx = await contract.deliverRedeemable(beni.address, amount2, redeemable2);
            await tx.wait();

            for (let index = amount1 + 1; index < amount2; index++) {
                const isRedeemable = await contract.isRedeemable(index);
                expect(
                    isRedeemable,
                    "True because ticket is redeemable"
                ).to.be.true;
            }
        });
    });

    describe("addTicketsAndDeliver", () => {
        it("reverts if caller is not owner", async () => {
            const [deployer, aloe, beni] = await ethers.getSigners();
            const amount = 4;
            await expect(
                contract.connect(aloe).addTicketsAndDeliver(aloe.address, amount),
                "Reverts if caller is not owner"
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
        it("does not change totalRemaining", async () => {
            const [deployer, aloe, beni] = await ethers.getSigners();

            let remaining1 = await contract.totalRemaining();
            expect(
                remaining1.toString(),
                "Remaining starts at 0 before we add tickets"
            ).to.equal("0");

            const amount = 4;
            let tx = await contract.addTicketsAndDeliver(aloe.address, amount);
            await tx.wait();
            let remaining2 = await contract.totalRemaining();
            expect(
                remaining2.toString(),
                "Remaining ends where we started"
            ).to.equal(remaining1.toString());
        });
        it("increases quantityHeldBy of holder", async () => {
            const [deployer, aloe, beni] = await ethers.getSigners();

            let quantity = await contract.quantityHeldBy(aloe.address);
            expect(
                quantity.toString(),
                "Quantity starts at 0 before delivery"
            ).to.equal("0");

            const amount = 1;
            let tx = await contract.addTicketsAndDeliver(aloe.address, amount);
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
            let tx = await contract.addTicketsAndDeliver(beni.address, amount);
            await tx.wait();

            for (let index = 1; index < amount + 1; index++) {
                const holder = await contract.holderOf(index);
                expect(
                    holder,
                    "Ticket holder is Beni"
                ).to.equal(beni.address);
            }
        });
        it("does not make tickets redeemable", async () => {
            const [deployer, aloe, beni] = await ethers.getSigners();

            const amount = 11;
            let tx = await contract.addTicketsAndDeliver(beni.address, amount);
            await tx.wait();

            for (let index = 1; index < amount + 1; index++) {
                const isRedeemable = await contract.isRedeemable(index);
                expect(
                    isRedeemable,
                    "Ticket is not redeemable"
                ).to.be.false;
            }
        });
    });

    describe("addRedeemableTicketsAndDeliver", () => {
        it("reverts if caller is not owner", async () => {
            const [deployer, aloe, beni] = await ethers.getSigners();
            const amount = 4;
            await expect(
                contract.connect(aloe).addRedeemableTicketsAndDeliver(
                    aloe.address,
                    amount,
                    true
                ),
                "Reverts if caller is not owner"
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
        it("does not change totalRemaining", async () => {
            const [deployer, aloe, beni] = await ethers.getSigners();

            const redeemable = true;
            let remaining1 = await contract.totalRemaining();
            expect(
                remaining1.toString(),
                "Remaining starts at 0 before we add tickets"
            ).to.equal("0");

            const amount = 4;
            let tx = await contract.addRedeemableTicketsAndDeliver(aloe.address, amount, redeemable);
            await tx.wait();
            let remaining2 = await contract.totalRemaining();
            expect(
                remaining2.toString(),
                "Remaining ends where we started"
            ).to.equal(remaining1.toString());
        });
        it("increases quantityHeldBy of holder", async () => {
            const [deployer, aloe, beni] = await ethers.getSigners();

            const redeemable = true;
            let quantity = await contract.quantityHeldBy(aloe.address);
            expect(
                quantity.toString(),
                "Quantity starts at 0 before delivery"
            ).to.equal("0");

            const amount = 1;
            let tx = await contract.addRedeemableTicketsAndDeliver(aloe.address, amount, redeemable);
            await tx.wait();

            quantity = await contract.quantityHeldBy(aloe.address);
            expect(
                quantity.toString(),
                "Quantity increases by amount delivered"
            ).to.equal(amount.toString());
        });
        it("assigns `holder` for `ticketId`", async () => {
            const [deployer, aloe, beni] = await ethers.getSigners();

            const redeemable = true;
            const amount = 11;
            let tx = await contract.addRedeemableTicketsAndDeliver(beni.address, amount, redeemable);
            await tx.wait();

            for (let index = 1; index < amount + 1; index++) {
                const holder = await contract.holderOf(index);
                expect(
                    holder,
                    "Ticket holder is Beni"
                ).to.equal(beni.address);
            }
        });
        it("can make tickets redeemable", async () => {
            const [deployer, aloe, beni] = await ethers.getSigners();

            const redeemable1 = true;
            const amount1 = 11;
            let tx = await contract.addRedeemableTicketsAndDeliver(beni.address, amount1, redeemable1);
            await tx.wait();

            for (let index = 1; index < amount1 + 1; index++) {
                const isRedeemable = await contract.isRedeemable(index);
                expect(
                    isRedeemable,
                    "Ticket is redeemable"
                ).to.be.true;
            }

            const redeemable2 = false;
            const amount2 = 11;
            tx = await contract.addRedeemableTicketsAndDeliver(beni.address, amount2, redeemable2);
            await tx.wait();

            for (let index = amount1 + 1; index < amount2; index++) {
                const isRedeemable = await contract.isRedeemable(index);
                expect(
                    isRedeemable,
                    "False because ticket is not redeemable"
                ).to.be.false;
            }
        });
    });

    describe("setRedeemable", () => {
        it("can make ticket redeemable", async () => {
            const [deployer, aloe, beni] = await ethers.getSigners();

            const redeemableTrue = true;
            const redeemableFalse = false;

            const amount = 1;
            let tx = await contract.addTickets(amount);
            await tx.wait();
            const ticketId = amount;

            let isRedeemable = await contract.isRedeemable(ticketId);
            expect(
                isRedeemable,
                "False because newly added tickets are not redeemable by default"
            ).to.be.false;

            await contract.setRedeemable(ticketId, redeemableTrue);
            await tx.wait();

            isRedeemable = await contract.isRedeemable(ticketId);
            expect(
                isRedeemable,
                "True because ticket was set to redeemable"
            ).to.be.true;

            await contract.setRedeemable(ticketId, redeemableFalse);
            await tx.wait();

            isRedeemable = await contract.isRedeemable(ticketId);
            expect(
                isRedeemable,
                "False because ticket was set to not redeemable"
            ).to.be.false;
        });
    });
});
