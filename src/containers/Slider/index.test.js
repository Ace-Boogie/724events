import {render, screen, within, act} from "@testing-library/react";
import Slider from "./index";
import {api, DataProvider} from "../../contexts/DataContext";

const data = {
    focus: [
        {
            title: "World economic forum",
            description:
                "Oeuvre à la coopération entre le secteur public et le privé.",
            date: "2022-02-28T20:28:45.744Z",
            cover: "/images/evangeline-shaw-nwLTVwb7DbU-unsplash1.png",
        },
        {
            title: "World Gaming Day",
            description: "Evenement mondial autour du gaming",
            date: "2022-03-29T20:28:45.744Z",
            cover: "/images/evangeline-shaw-nwLTVwb7DbU-unsplash1.png",
        },
        {
            title: "World Farming Day",
            description: "Evenement mondial autour de la ferme",
            date: "2022-01-29T20:28:45.744Z",
            cover: "/images/evangeline-shaw-nwLTVwb7DbU-unsplash1.png",
        },
    ],
};

const expectedOrder = [
    "World Gaming Day",
    "World economic forum",
    "World Farming Day",
];

describe("When slider is created", () => {
    afterEach(() => {
        jest.useRealTimers();
    });
    it("a list card is displayed", async () => {
        window.console.error = jest.fn();
        api.loadData = jest.fn().mockReturnValue(data);
        render(
            <DataProvider>
                <Slider/>
            </DataProvider>
        );
        await screen.findByText("World economic forum");
        await screen.findByText("janvier");
        await screen.findByText(
            "Oeuvre à la coopération entre le secteur public et le privé."
        );
    });

    it("sorts the cards by date, in descending order", async () => {
        window.console.error = jest.fn();
        api.loadData = jest.fn().mockReturnValue(data);
        const {container} = render(
            <DataProvider>
                <Slider/>
            </DataProvider>
        );
        await screen.findByText("World Gaming Day");

        const renderedTitles = Array.from(container.querySelectorAll(".SlideCard h3"))
            .map((node) => node.textContent);

        expect(renderedTitles).toEqual([
            "Faux titre pour test",
            "World economic forum",
            "World Farming Day",
        ]);
    });

    it("shows only the most recent event first", async () => {
        window.console.error = jest.fn();
        api.loadData = jest.fn().mockReturnValue(data);
        const {container} = render(
            <DataProvider>
                <Slider/>
            </DataProvider>
        );
        await screen.findByText("World Gaming Day");

        const visibleCards = container.querySelectorAll(".SlideCard--display");
        expect(visibleCards).toHaveLength(1);
        expect(within(visibleCards[0]).getByRole("heading")).toHaveTextContent(
            "World Gaming Day"
        );
    });

    it("cycles back to the first slide without showing an empty one", async () => {
        window.console.error = jest.fn();
        api.loadData = jest.fn().mockResolvedValue(data);

        jest.useFakeTimers();

        const {container} = render(
            <DataProvider>
                <Slider/>
            </DataProvider>
        );

        await act(async () => {
        });

        const visibleTitle = () => {
            const cards = container.querySelectorAll(".SlideCard--display");
            expect(cards).toHaveLength(1);
            return within(cards[0]).getByRole("heading").textContent;
        };

        expect(visibleTitle()).toBe(expectedOrder[0]);

        for (let step = 1; step <= 3; step += 1) {
            act(() => {
                jest.advanceTimersByTime(5000);
            });
            expect(visibleTitle()).toBe(expectedOrder[step % 3]);
        }
    });

    it("renders one radio per slide, with the current one checked", async () => {
        window.console.error = jest.fn();
        api.loadData = jest.fn().mockResolvedValue(data);

        render(
            <DataProvider>
                <Slider/>
            </DataProvider>
        );

        await screen.findByText("World Gaming Day");

        const radios = screen.getAllByRole("radio");
        expect(radios).toHaveLength(data.focus.length);
        expect(radios[0]).toBeChecked();
        expect(radios[1]).not.toBeChecked();
        expect(radios[2]).not.toBeChecked();
    });
});