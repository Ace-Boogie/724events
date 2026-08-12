import { render, screen, waitFor } from "@testing-library/react";
import { api, DataProvider, useData } from "./index";

// api.loadData est écrasé par les tests du provider : on capture ici la vraie
// implémentation pour pouvoir la tester telle quelle plus bas.
const realLoadData = api.loadData;

// Les événements sont volontairement dans le désordre : si `last` était calculé
// en prenant simplement le dernier élément du tableau, le test échouerait.
const mockData = {
    events: [
        { id: 1, title: "Ancien événement", date: "2022-01-29T20:28:45.744Z" },
        { id: 2, title: "Dernier événement", date: "2022-08-29T20:28:45.744Z" },
        { id: 3, title: "Événement intermédiaire", date: "2022-04-29T20:28:45.744Z" },
    ],
    focus: [{ title: "Focus", date: "2022-05-29T20:28:45.744Z" }],
};

// Composant sonde : chaque valeur du contexte est rendue dans un noeud dédié,
// ce qui permet d'asserter aussi bien la présence que l'ABSENCE de chacune.
const Consumer = () => {
    const { data, error, last } = useData();
    return (
        <div>
            {data && <div data-testid="events-count">{data.events.length}</div>}
            {last && <div data-testid="last-event">{last.title}</div>}
            {error && <div data-testid="error">{error.message}</div>}
        </div>
    );
};

const renderWithProvider = () =>
    render(
        <DataProvider>
            <Consumer />
        </DataProvider>
    );

describe("useData", () => {
    beforeEach(() => {
        window.console.error = jest.fn();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("when the API call succeeds", () => {
        it("exposes the loaded data", async () => {
            api.loadData = jest.fn().mockResolvedValue(mockData);

            renderWithProvider();

            expect(await screen.findByTestId("events-count")).toHaveTextContent("3");
        });

        it("does not expose any error", async () => {
            api.loadData = jest.fn().mockResolvedValue(mockData);

            renderWithProvider();

            await screen.findByTestId("events-count");
            expect(screen.queryByTestId("error")).not.toBeInTheDocument();
        });

        it("exposes the most recent event as `last`", async () => {
            api.loadData = jest.fn().mockResolvedValue(mockData);

            renderWithProvider();

            expect(await screen.findByTestId("last-event")).toHaveTextContent(
                "Dernier événement"
            );
        });

        it("calls the API only once", async () => {
            api.loadData = jest.fn().mockResolvedValue(mockData);

            renderWithProvider();

            await screen.findByTestId("events-count");
            // Verrouille la correction du useEffect sans tableau de dépendances,
            // qui relançait l'appel à chaque rendu.
            await waitFor(() => expect(api.loadData).toHaveBeenCalledTimes(1));
        });
    });

    describe("when the API call fails", () => {
        it("exposes the error", async () => {
            api.loadData = jest
                .fn()
                .mockRejectedValue(new Error("error on calling events"));

            renderWithProvider();

            expect(await screen.findByTestId("error")).toHaveTextContent(
                "error on calling events"
            );
        });

        it("does not expose any data", async () => {
            api.loadData = jest
                .fn()
                .mockRejectedValue(new Error("error on calling events"));

            renderWithProvider();

            await screen.findByTestId("error");
            expect(screen.queryByTestId("events-count")).not.toBeInTheDocument();
            expect(screen.queryByTestId("last-event")).not.toBeInTheDocument();
        });
    });

    describe("api.loadData", () => {
        beforeEach(() => {
            // Les tests précédents ont remplacé api.loadData par un mock :
            // on restaure la vraie implémentation avant de la tester.
            api.loadData = realLoadData;
        });

        it("fetches events.json and returns the parsed body", async () => {
            const json = jest.fn().mockResolvedValue(mockData);
            global.fetch = jest.fn().mockResolvedValue({ json });

            const result = await api.loadData();

            expect(global.fetch).toHaveBeenCalledWith("/events.json");
            expect(json).toHaveBeenCalled();
            expect(result).toEqual(mockData);
        });

        it("propagates the error when fetch rejects", async () => {
            global.fetch = jest.fn().mockRejectedValue(new Error("network down"));

            await expect(api.loadData()).rejects.toThrow("network down");
        });
    });
});