import getCurrentUser from "../actions/getCurrentUser";
import getListings from "../actions/getListings";
import getCurrentUser_ from "../actions/anchor/getCurrentUser";
import getListings_ from "../actions/anchor/getListings";
import ClientOnly from "../components/ClientOnly";
import ListingCard from "../components/listing/ListingCard";
import PriceSwitch from "../components/inputs/PriceSwitch";

// TODO
// . agregar los campos que flatan en la blockchain
// . usar los valores de la blockchain para mapearlo y mostrarlo en el frontend
// . realizar un write desde el frontend a la blochain
//    - hacer un reservation por el guest
export default async function Home({ searchParams }: any) {
  const [
    listings,
    currentUser,
    listings_,
    // currentUser_,
  ] = await Promise.all([
    getListings(searchParams),
    getCurrentUser(),
    getListings_(),
    // getCurrentUser_(),
  ]);

  return (
    <ClientOnly>
      <main className="pb-20 px-5 phone:px-10 large:px-20">
        <PriceSwitch />
        <div className="grid grid-cols-1 sm:grid-cols-2 small:grid-cols-3 medium:grid-cols-4 2xl:grid-cols-5 largest:grid-cols-6 gap-8">
          {
            listings_ && listings_.length > 0 ? (
              listings_.map((listing) => (
                <ListingCard
                  key={listing.id}
                  data={listing}
                  currentUser={currentUser}
                />
              ))
            ) : (
              <div>There are no blockchain listings yet</div>
            )
          }
        </div>
      </main>
    </ClientOnly>
  );
}
